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
        "actions/addcssclass",
        "actions/applycollisiondetectiongroup",
        "actions/captureimage",
        "actions/changenode",
        "actions/changeproperty",
        "actions/grantsessionaccess",
        "actions/removecssclass",
        "actions/setcssstyle",
        "actions/setvariable",
        "actions/triggerevent",
        "components/2013/audio",
        "components/2013/box",
        "components/2013/dummy",
        "components/2013/image",
        "components/2013/text",
        "components/2013/video",
        "components/2015/youtube",
        "components/2015/areena",
        "requirelib"
    ],

    /* Files which are exluded from processing. */
    "exclude": [],

    paths: {
        'jquery': "libs/jquery-2.0.3",
        'requirelib': "libs/require",
        'lodash': "libs/lodash",
        'extend': "libs/extend",
        'verge': "libs/verge",
        //'pixi': "libs/pixi.dev",
        //'html2canvas': "libs/html2canvas",
        'binaryajax': "libs/binaryajax",
        'exif': "libs/exif",
        'fpsmeter': "libs/fpsmeter"
    },
    shim: {
        'extend': {
            exports: 'BaseClass'
        },
        'verge': {
            exports: 'verge'
        },
       /* 'html2canvas': {
            exports: 'html2canvas'
        },
        'pixi': {
            exports: 'pixi'
        }, */
        'binaryajax': {
            exports: 'Asd',
            init: function () {
                return{
                    BinaryFile: this.BinaryFile,
                    BinaryAjax: this.BinaryAjax
                };
            }
        },
        'exif': {
            exports: 'EXIF'
        },
        'fpsmeter': {
            exports: "FPSMeter"
        }
    }

})