/* =========================================================
   analyzeController.js
   Main controller handling code analysis requests
========================================================= */

const regexEngine = require("../utils/regexEngine");
const scoreEngine = require("../utils/scoreEngine");
const formatterEngine = require("../utils/formatterEngine");
const responseBuilder = require("../utils/responseBuilder");

exports.performAnalysis = async (req, res, next) => {
    try {
        const { code } = req.body;

        // 1. Run regex-based beginner checks + smell detection
        const issueList = await regexEngine.runAllChecks(code);

        // 2. Score the code
        const score = scoreEngine.computeScore(issueList, code);

        // 3. Produce improved version
        const improved = formatterEngine.generateImprovedVersion(code);

        // 4. Build final API response
        const output = responseBuilder.build({
            issues: issueList,
            score,
            before: code,
            after: improved
        });

        res.json(output);

    } catch (err) {
        next(err); // send to global error handler
    }
};
