/* dev-checks.jsx
   Runtime data-contract validator for the Stage 4 Music site.
   Self-contained IIFE; no import/export; classic global-scope script.

   Load AFTER curriculum.jsx, quiz-data.jsx, sections-data.jsx in index.html.
   Runs once on page load and logs any mismatches to the console.

   Checks:
     1. Every CURRICULUM topic has a QUIZ_BY_TOPIC entry.
     2. Every SECTION_EXTRAS key maps to a real topic id + a valid deep index.
     3. (Info) How many deep sections per topic have no SECTION_EXTRAS entry.
*/

(function devChecks() {
  try {
    var curriculum    = window.CURRICULUM;
    var quizByTopic   = window.QUIZ_BY_TOPIC;
    var sectionExtras = window.SECTION_EXTRAS;

    // If any global is missing, bail out silently.
    if (!curriculum || !quizByTopic || !sectionExtras) {
      if (!curriculum)    console.warn("[contract] devChecks: window.CURRICULUM is not defined - skipping checks");
      if (!quizByTopic)   console.warn("[contract] devChecks: window.QUIZ_BY_TOPIC is not defined - skipping checks");
      if (!sectionExtras) console.warn("[contract] devChecks: window.SECTION_EXTRAS is not defined - skipping checks");
      return;
    }

    var problems = 0;

    // ----------------------------------------------------------------
    // Build a flat lookup: topicId -> topic object (across all years)
    // ----------------------------------------------------------------
    var topicById = {};

    var years = Object.keys(curriculum);
    for (var yi = 0; yi < years.length; yi++) {
      var yearKey = years[yi];
      var yearData = curriculum[yearKey];
      if (!yearData || !Array.isArray(yearData.topics)) continue;

      var topics = yearData.topics;
      for (var ti = 0; ti < topics.length; ti++) {
        var topic = topics[ti];
        if (topic && topic.id) {
          topicById[topic.id] = topic;
        }
      }
    }

    // ----------------------------------------------------------------
    // Check 1: every topic must have a QUIZ_BY_TOPIC entry
    // ----------------------------------------------------------------
    var topicIds = Object.keys(topicById);
    for (var i = 0; i < topicIds.length; i++) {
      var id = topicIds[i];
      if (!Object.prototype.hasOwnProperty.call(quizByTopic, id) ||
          !Array.isArray(quizByTopic[id]) ||
          quizByTopic[id].length === 0) {
        console.warn('[contract] topic "' + id + '" has no QUIZ_BY_TOPIC entry');
        problems++;
      }
    }

    // ----------------------------------------------------------------
    // Check 2: every SECTION_EXTRAS key must refer to a real topic + valid index
    // ----------------------------------------------------------------
    var extrasKeys = Object.keys(sectionExtras);
    for (var j = 0; j < extrasKeys.length; j++) {
      var key = extrasKeys[j];
      var slashPos = key.indexOf('/');

      if (slashPos === -1) {
        console.warn('[contract] SECTION_EXTRAS key "' + key + '" has no "/" separator - expected format topicId/index');
        problems++;
        continue;
      }

      var topicId = key.slice(0, slashPos);
      var indexStr = key.slice(slashPos + 1);
      var index = parseInt(indexStr, 10);

      if (!Object.prototype.hasOwnProperty.call(topicById, topicId)) {
        console.warn('[contract] SECTION_EXTRAS key "' + key + '" -> topic "' + topicId + '" not found in CURRICULUM');
        problems++;
        continue;
      }

      var matchedTopic = topicById[topicId];
      var deep = Array.isArray(matchedTopic.deep) ? matchedTopic.deep : [];

      if (isNaN(index) || index < 0 || index >= deep.length) {
        console.warn('[contract] SECTION_EXTRAS key "' + key + '" -> index ' + indexStr + ' out of range (deep length ' + deep.length + ')');
        problems++;
      }
    }

    // ----------------------------------------------------------------
    // Check 3 (info): count deep sections with no SECTION_EXTRAS entry
    // ----------------------------------------------------------------
    var infoLines = [];
    for (var k = 0; k < topicIds.length; k++) {
      var tid = topicIds[k];
      var tdeep = Array.isArray(topicById[tid].deep) ? topicById[tid].deep : [];
      var missing = 0;
      for (var d = 0; d < tdeep.length; d++) {
        var skey = tid + '/' + d;
        if (!Object.prototype.hasOwnProperty.call(sectionExtras, skey)) {
          missing++;
        }
      }
      if (missing > 0) {
        infoLines.push(tid + ': ' + missing + '/' + tdeep.length);
      }
    }

    if (infoLines.length > 0) {
      console.info('[contract] deep sections with no SECTION_EXTRAS (still render fine): ' + infoLines.join(', '));
    }

    // ----------------------------------------------------------------
    // Final verdict
    // ----------------------------------------------------------------
    if (problems === 0) {
      console.log('[contract] all data contracts OK');
    }

  } catch (err) {
    // Never throw - just report the internal error and bail.
    console.warn('[contract] devChecks threw unexpectedly:', err);
  }
}());
