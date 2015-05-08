/**
 * @preserve Copyright (c) 2013 Yleisradio (YLE)
 * (http://www.yle.fi) and MagicasterJS Contributors (1)
 *
 * (1) MagicasterJS Contributors are listed in the AUTHORS file.
 *     Please extend this file, not this notice.
 *
 * @license Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * All rights reserved
 * Please contact us for an alternative licence
 */


({
    /* Base URL of the assets */
    baseUrl: "../src/",

    /* Main module name */
    name: "core/magicaster",

    /* Recursive search of the dependencies as require() is used within code also. */
    findNestedDependencies: true,

    /* Minified and optimizized file name */
    out: "../src/magicaster.min.js",

    /* Other includes which are not found by searching the main module recursively.
     * In Magicast case these include certain actions and components (including base component). */
    "include": [
        "actions/2015/addcssclass",
        "actions/2015/applycollisiondetectiongroup",
        "actions/2015/cancelfullscreen",
        "actions/2015/captureimage",
        "actions/2015/changecssproperty",
        "actions/2015/changenode",
        "actions/2015/changeproperty",
        "actions/2015/controlaudio",
        "actions/2015/controlbox",
        "actions/2015/controlimage",
        "actions/2015/controltext",
        "actions/2015/controlvideo",
        "actions/2015/controlyoutube",
        "actions/2015/grantsessionaccess",
        "actions/2015/openbrowser",
        "actions/2015/removecssclass",
        "actions/2015/requestfullscreen",
        "actions/2015/sendanalytics",
        "actions/2015/setcsstext",
        "actions/2015/setvariable",
        "actions/2015/triggerevent",
        "components/2015/areena",
        "components/2015/audio",
        "components/2015/box",
        "components/2015/cache",
        "components/2015/dummy",
        "components/2015/image",
        "components/2015/text",
        "components/2015/video",
        "components/2015/youtube",
        "requirelib"
    ],

    /* Files which are exluded from processing. */
    "exclude": [],

    paths: {
		'requirelib': "libs/require",
		'jquery': "libs/jquery-2.0.3",
		'jquery.easing': "libs/jquery.easing.1.3",
		'jquery.color': "libs/jquery.color.plus-names-2.1.2",
		'lodash': "libs/lodash",
		'verge': "libs/verge",
		'html2canvas': "libs/html2canvas",
		'fpsmeter': "libs/fpsmeter",
		'webfont': "libs/webfont"
    },
    shim: {
		'jquery.easing': {
			deps: ['jquery']
		},
		'jquery.color': {
			deps: ['jquery']
		},
        'verge': {
            exports: 'verge'
        },
		'html2canvas': {
			exports: 'html2canvas'
		},
        'fpsmeter': {
            exports: "FPSMeter"
        },
		'webfont': {
			exports: 'WebFont'
		}
	}

})