using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Net.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Vansah.Tools
{
    public class ImportResult
    {
        public string       FeatureFile { get; set; }
        public List<string> Succeeded   { get; set; } = new List<string>();
        public List<string> Failed      { get; set; } = new List<string>();
    }

    public class VansahImporter
    {
        private readonly VansahConfig _config;
        private static readonly HttpClient _httpClient = new HttpClient();

        // Tags that map to Vansah priority — excluded from labels
        private static readonly Dictionary<string, int> PriorityMap =
            new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["High"]     = 2,
                ["Medium"]   = 3,
                ["Low"]      = 4,
                ["Critical"] = 10000,
                ["Highest"]  = 1,
            };

        public VansahImporter(VansahConfig config)
        {
            _config = config;
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", _config.VansahToken);
        }

        // ── Public entry point ────────────────────────────────────────────────────

        public async Task<ImportResult> ImportFeatureFileAsync(string featureFilePath)
        {
            if (!File.Exists(featureFilePath))
                throw new FileNotFoundException($"Feature file not found: {featureFilePath}");

            var scenarios = ParseScenarios(File.ReadAllText(featureFilePath));
            var result    = new ImportResult { FeatureFile = featureFilePath };

            Console.WriteLine($"\n[Vansah] Parsed {scenarios.Count} scenario(s) from: {Path.GetFileName(featureFilePath)}");
            Console.WriteLine($"[Vansah] Target folder : {_config.FolderIdentifier}");
            Console.WriteLine($"[Vansah] Project key   : {_config.ProjectKey}\n");

            foreach (var scenario in scenarios)
            {
                var success = await CreateTestCaseAsync(scenario);
                if (success) result.Succeeded.Add(scenario.Title);
                else         result.Failed.Add(scenario.Title);
            }

            Console.WriteLine($"\n[Vansah] Done — {result.Succeeded.Count} created, {result.Failed.Count} failed.\n");
            return result;
        }

        // ── Gherkin parser ────────────────────────────────────────────────────────

        private List<ScenarioData> ParseScenarios(string content)
        {
            var scenarios    = new List<ScenarioData>();
            var lines        = content.Split(new[] { '\r', '\n' }, StringSplitOptions.None);
            ScenarioData current     = null;
            bool         inExamples  = false;
            var          pendingTags = new List<string>();
            var          pendingDesc = new List<string>();
            string       pendingPrec = null;

            foreach (var raw in lines)
            {
                var line = raw.Trim();
                if (string.IsNullOrWhiteSpace(line)) continue;

                // ── Tag lines ─────────────────────────────────────────────────────
                if (line.StartsWith("@"))
                {
                    foreach (var token in line.Split(' '))
                        if (token.StartsWith("@")) pendingTags.Add(token.TrimStart('@'));
                    continue;
                }

                // ── Comment lines ─────────────────────────────────────────────────
                if (line.StartsWith("#"))
                {
                    if (line.Contains("──")) continue;

                    var precMatch = Regex.Match(line, @"^#\s*Precondition:\s*(.+)$", RegexOptions.IgnoreCase);
                    if (precMatch.Success) { pendingPrec = precMatch.Groups[1].Value.Trim(); continue; }

                    var descMatch = Regex.Match(line, @"^#\s*(?:Test Case Summary|Description):\s*(.+)$", RegexOptions.IgnoreCase);
                    if (descMatch.Success) { pendingDesc.Add(descMatch.Groups[1].Value.Trim()); continue; }

                    continue;
                }

                // ── Feature / Background reset ────────────────────────────────────
                if (Regex.IsMatch(line, @"^(Feature:|Background:)", RegexOptions.IgnoreCase))
                {
                    pendingTags.Clear();
                    pendingDesc.Clear();
                    pendingPrec = null;
                    current     = null;
                    continue;
                }

                if (line.StartsWith("Examples:")) { inExamples = true; continue; }

                // ── Scenario / Scenario Outline header ────────────────────────────
                if (Regex.IsMatch(line, @"^Scenario(?: Outline)?:", RegexOptions.IgnoreCase))
                {
                    if (current != null) scenarios.Add(current);
                    inExamples = false;
                    current = new ScenarioData
                    {
                        Title        = Regex.Replace(line, @"^Scenario(?: Outline)?:\s*", "", RegexOptions.IgnoreCase).Trim(),
                        Tags         = new List<string>(pendingTags),
                        Description  = pendingDesc.Count > 0 ? string.Join("\n", pendingDesc) : null,
                        Precondition = pendingPrec
                    };
                    pendingTags.Clear();
                    pendingDesc.Clear();
                    pendingPrec = null;
                    continue;
                }

                if (current == null) continue;

                // ── Example table rows ────────────────────────────────────────────
                if (inExamples)
                {
                    if (line.StartsWith("|")) current.ExampleRows.Add(line);
                    continue;
                }

                // ── Step lines ────────────────────────────────────────────────────
                if (Regex.IsMatch(line, @"^(Given|When|Then|And|But|\*)\s", RegexOptions.IgnoreCase))
                    current.Steps.Add(line);
            }

            if (current != null) scenarios.Add(current);
            return scenarios;
        }

        // ── Step 1: Create test case ──────────────────────────────────────────────

        private async Task<bool> CreateTestCaseAsync(ScenarioData scenario)
        {
            // Resolve priority and labels from tags
            int?         priorityJiraId = null;
            var          labels         = new List<string>();

            foreach (var tag in scenario.Tags)
            {
                if (PriorityMap.TryGetValue(tag, out int jiraId))
                    priorityJiraId = jiraId;
                else
                    labels.Add(tag);
            }

            var body = new JObject
            {
                ["headline"]     = scenario.Title,
                ["precondition"] = !string.IsNullOrWhiteSpace(scenario.Precondition) ? scenario.Precondition : "N/A",
                ["project"]      = new JObject { ["key"] = _config.ProjectKey },
                ["folder"]       = new JArray { new JObject { ["identifier"] = _config.FolderIdentifier } }
            };

            if (!string.IsNullOrWhiteSpace(_config.TypeIdentifier))
                body["type"] = new JObject { ["identifier"] = _config.TypeIdentifier };

            if (!string.IsNullOrWhiteSpace(scenario.Description))
                body["description"] = scenario.Description;

            if (labels.Count > 0)
                body["label"] = new JArray(labels.ToArray());

            if (priorityJiraId.HasValue)
                body["priority"] = new JObject { ["jiraID"] = priorityJiraId.Value.ToString() };

            Console.WriteLine($"  [DEBUG] {scenario.Title}");
            Console.WriteLine($"    description  : {scenario.Description ?? "(none)"}");
            Console.WriteLine($"    precondition : {scenario.Precondition ?? "(none)"}");
            Console.WriteLine($"    labels       : {(labels.Count > 0 ? string.Join(", ", labels) : "(none)")}");
            Console.WriteLine($"    priority     : {(priorityJiraId.HasValue ? priorityJiraId.Value.ToString() : "(none)")}");

            var httpContent = new StringContent(body.ToString(Formatting.Indented), Encoding.UTF8, "application/json");

            try
            {
                var url      = $"{_config.VansahApiUrl.TrimEnd('/')}/api/v1/testCase";
                var response = await _httpClient.PostAsync(url, httpContent);
                var raw      = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var parsed     = JObject.Parse(raw);
                    var key        = parsed["data"]?["key"]?.ToString() ?? "N/A";
                    var identifier = parsed["data"]?["identifier"]?.ToString();

                    Console.WriteLine($"    caseKey      : {key}");

                    if (!string.IsNullOrEmpty(identifier) && scenario.Steps.Count > 0)
                        await SetBddStepsAsync(key, identifier, scenario);

                    Console.WriteLine($"  [OK]   {scenario.Title}  →  {key}");
                    return true;
                }
                else
                {
                    Console.WriteLine($"  [FAIL] {scenario.Title}");
                    Console.WriteLine($"         HTTP {(int)response.StatusCode}: {raw}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  [ERROR] {scenario.Title} — {ex.Message}");
                return false;
            }
        }

        // ── Steps 2a / 2b / 2c : Set BDD script (original 3-step process) ────────

        private async Task SetBddStepsAsync(string caseKey, string testCaseIdentifier, ScenarioData scenario)
        {
            // Step 2a: PUT — mark test case script type as BDD
            var setTypeBody    = new JObject { ["scriptType"] = "bdd", ["caseVersion"] = 1 };
            var setTypeContent = new StringContent(setTypeBody.ToString(Formatting.None), Encoding.UTF8, "application/json");
            await _httpClient.PutAsync(
                $"{_config.VansahApiUrl.TrimEnd('/')}/api/v1/testCase/{testCaseIdentifier}",
                setTypeContent);

            // Step 2b: POST — create empty BDD testScript record, retrieve scriptId
            var createBody = new JObject
            {
                ["scriptType"]      = "bdd",
                ["project"]         = new JObject { ["key"] = _config.ProjectKey },
                ["testCaseVersion"] = 1
            };
            var createContent = new StringContent(createBody.ToString(Formatting.None), Encoding.UTF8, "application/json");
            var createUrl     = $"{_config.VansahApiUrl.TrimEnd('/')}/api/v1/testCase/{testCaseIdentifier}/testScript";
            var createResp    = await _httpClient.PostAsync(createUrl, createContent);
            var createRaw     = await createResp.Content.ReadAsStringAsync();

            if (!createResp.IsSuccessStatusCode)
            {
                Console.WriteLine($"  [WARN] Could not create testScript for {caseKey}: HTTP {(int)createResp.StatusCode}: {createRaw}");
                return;
            }

            var scriptId = JObject.Parse(createRaw)?["data"]?["identifier"]?.ToString();
            if (string.IsNullOrEmpty(scriptId))
            {
                Console.WriteLine($"  [WARN] No testScript identifier returned for {caseKey}: {createRaw}");
                return;
            }

            // Step 2c: PUT — write Given/When/Then steps into the testScript record
            var stepsBody = new JObject
            {
                ["scriptType"]      = "bdd",
                ["project"]         = new JObject { ["key"] = _config.ProjectKey },
                ["bddData"]         = BuildStepsText(scenario),
                ["testCaseVersion"] = 1
            };
            var stepsContent = new StringContent(stepsBody.ToString(Formatting.None), Encoding.UTF8, "application/json");
            var stepsUrl     = $"{_config.VansahApiUrl.TrimEnd('/')}/api/v1/testCase/testScript/{scriptId}";
            var stepsResp    = await _httpClient.PutAsync(stepsUrl, stepsContent);
            var stepsRaw     = await stepsResp.Content.ReadAsStringAsync();

            if (stepsResp.IsSuccessStatusCode)
                Console.WriteLine($"    testScript   : saved (bdd, scriptId: {scriptId})");
            else
                Console.WriteLine($"  [WARN] BDD steps not set for {caseKey}: HTTP {(int)stepsResp.StatusCode}: {stepsRaw}");
        }

        // ── Build steps text ──────────────────────────────────────────────────────

        private string BuildStepsText(ScenarioData scenario)
        {
            var sb = new StringBuilder();

            foreach (var step in scenario.Steps)
                sb.AppendLine($"    {step.Replace("<", "&lt;").Replace(">", "&gt;")}");

            if (scenario.ExampleRows.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("    Examples:");
                foreach (var row in scenario.ExampleRows)
                    sb.AppendLine($"      {row}");
            }

            return sb.ToString().TrimEnd();
        }

        // ── Inner types ───────────────────────────────────────────────────────────

        private class ScenarioData
        {
            public string       Title        { get; set; }
            public string       Description  { get; set; }
            public string       Precondition { get; set; }
            public List<string> Steps        { get; set; } = new List<string>();
            public List<string> ExampleRows  { get; set; } = new List<string>();
            public List<string> Tags         { get; set; } = new List<string>();
        }
    }
}
