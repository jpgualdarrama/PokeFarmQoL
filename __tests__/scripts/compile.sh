#!/bin/bash
echo "Compiling code into one js file..."

# Order from Poke-Farm-QoL.user.js
ROOT="."
TOP_LEVEL="${ROOT}/Poke-Farm-QoL.user.js"
declare -a EXTERNALS=("${ROOT}/node_modules/jquery/dist/jquery.min.js"
                     )
declare -a INPUT=("${ROOT}/requires/utils/helpers.js"
                  "${ROOT}/requires/utils/globals.js"
                  "${ROOT}/requires/utils/evolutionTreeParser.js"
                  "${ROOT}/requires/utils/dexPageParser.js"
                  "${ROOT}/requires/utils/localStorageManager.js"
                  "${ROOT}/requires/utils/dexUtilities.js"
                  "${ROOT}/requires/utils/qolHub.js"
                  "${ROOT}/requires/pages/basePage.js"
                  "${ROOT}/requires/pages/shelterPage.js"
                  "${ROOT}/requires/pages/privateFieldsPage.js"
                  "${ROOT}/requires/pages/publicFieldsPage.js"
                  "${ROOT}/requires/pages/labPage.js"
                  "${ROOT}/requires/pages/fishingPage.js"
                  "${ROOT}/requires/pages/multiuserPage.js"
                  "${ROOT}/requires/pages/farmPage.js"
                  "${ROOT}/requires/pages/daycarePage.js"
                  "${ROOT}/requires/pages/dexPage.js"
                  "${ROOT}/requires/pages/wishforgePage.js"
                  "${TOP_LEVEL}"
                  )
OUTPUT="${ROOT}/__tests__/compiled.js"

# try to mimic the web environment
echo "" > "${OUTPUT}"
echo "const GM_getResourceText = require('../__mocks__/tampermonkey').GM_getResourceText" >> "${OUTPUT}"
echo "const GM_xmlhttpRequest  = require('../__mocks__/tampermonkey').GM_xmlhttpRequest" >> "${OUTPUT}"
echo "const GM_addStyle        = require('../__mocks__/tampermonkey').GM_addStyle" >> "${OUTPUT}"
echo "const GM_info            = require('../__mocks__/tampermonkey').GM_info" >> "${OUTPUT}"

for FILE in "${EXTERNALS[@]}"; do
   echo "/* istanbul ignore next */" >> "${OUTPUT}"
   cat "$FILE" >> "${OUTPUT}"
   echo "" >> "${OUTPUT}"
done

for FILE in "${INPUT[@]}"; do
   cat "$FILE" >> "${OUTPUT}"
   echo "" >> "${OUTPUT}"
done

echo "Compilation complete!: ${OUTPUT}"