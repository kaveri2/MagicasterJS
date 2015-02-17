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

define(function () {
    "use strict";

    var KeyEvents = (function () {

        var KeyEvent = {};

        /* Device classes should map device-specific keycodes to the following... */

        /**
         * Virtual key code for the enter/select button.
         * Based on CEA-2014-A CE-HTML Annex F
         * @memberOf antie.events.KeyEvent
         * @name VK_ENTER
         * @constant
         * @static
         */
        KeyEvent[13] = "VK_ENTER";
        /**
         * Virtual key code for the left cursor/arrow button.
         * Based on CEA-2014-A CE-HTML Annex F
         * @memberOf antie.events.KeyEvent
         * @name VK_LEFT
         * @constant
         * @static
         */
        KeyEvent[37] = "VK_LEFT";

        /**
         * Virtual key code for the up cursor/arrow button.
         * Based on CEA-2014-A CE-HTML Annex F
         * @memberOf antie.events.KeyEvent
         * @name VK_UP
         * @constant
         * @static
         */
        KeyEvent[38] = "VK_UP";

        /**
         * Virtual key code for the right cursor/arrow button.
         * Based on CEA-2014-A CE-HTML Annex F
         * @memberOf antie.events.KeyEvent
         * @name VK_RIGHT
         * @constant
         * @static
         */
        KeyEvent[39] = "VK_RIGHT";

        /**
         * Virtual key code for the down cursor/arrow button.
         * Based on CEA-2014-A CE-HTML Annex F
         * @memberOf antie.events.KeyEvent
         * @name VK_DOWN
         * @constant
         * @static
         */
        KeyEvent[40] = "VK_DOWN";

        /*KeyEvent.VK_SPACE = 32;

        KeyEvent.VK_BACK_SPACE = 8;

        KeyEvent.VK_0 = 48;
        KeyEvent.VK_1 = 49;
        KeyEvent.VK_2 = 50;
        KeyEvent.VK_3 = 51;
        KeyEvent.VK_4 = 52;
        KeyEvent.VK_5 = 53;
        KeyEvent.VK_6 = 54;
        KeyEvent.VK_7 = 55;
        KeyEvent.VK_8 = 56;
        KeyEvent.VK_9 = 57;
        */

        KeyEvent[48] = "VK_0";
        KeyEvent[49] = "VK_1";
        KeyEvent[50] = "VK_2";
        KeyEvent[51] = "VK_3";
        KeyEvent[52] = "VK_4";
        KeyEvent[53] = "VK_5";
        KeyEvent[54] = "VK_6";
        KeyEvent[55] = "VK_7";
        KeyEvent[56] = "VK_8";
        KeyEvent[57] = "VK_9";

        /*
        KeyEvent.VK_A = 65;
        KeyEvent.VK_B = 66;
        KeyEvent.VK_C = 67;
        KeyEvent.VK_D = 68;
        KeyEvent.VK_E = 69;
        KeyEvent.VK_F = 70;
        KeyEvent.VK_G = 71;
        KeyEvent.VK_H = 72;
        KeyEvent.VK_I = 73;
        KeyEvent.VK_J = 74;
        KeyEvent.VK_K = 75;
        KeyEvent.VK_L = 76;
        KeyEvent.VK_M = 77;
        KeyEvent.VK_N = 78;
        KeyEvent.VK_O = 79;
        KeyEvent.VK_P = 80;
        KeyEvent.VK_Q = 81;
        KeyEvent.VK_R = 82;
        KeyEvent.VK_S = 83;
        KeyEvent.VK_T = 84;
        KeyEvent.VK_U = 85;
        KeyEvent.VK_V = 86;
        KeyEvent.VK_W = 87;
        KeyEvent.VK_X = 88;
        KeyEvent.VK_Y = 89;
        KeyEvent.VK_Z = 90;  */

        KeyEvent[65] = "VK_A";
        KeyEvent[66] = "VK_B";
        KeyEvent[67] = "VK_C";
        KeyEvent[68] = "VK_D";
        KeyEvent[69] = "VK_E";
        KeyEvent[70] = "VK_F";
        KeyEvent[71] = "VK_G";
        KeyEvent[72] = "VK_H";
        KeyEvent[73] = "VK_I";
        KeyEvent[74] = "VK_J";
        KeyEvent[75] = "VK_K";
        KeyEvent[76] = "VK_L";
        KeyEvent[77] = "VK_M";
        KeyEvent[78] = "VK_N";
        KeyEvent[79] = "VK_O";
        KeyEvent[80] = "VK_P";
        KeyEvent[81] = "VK_Q";
        KeyEvent[82] = "VK_R";
        KeyEvent[83] = "VK_S";
        KeyEvent[84] = "VK_T";
        KeyEvent[85] = "VK_U";
        KeyEvent[86] = "VK_V";
        KeyEvent[87] = "VK_W";
        KeyEvent[88] = "VK_X";
        KeyEvent[89] = "VK_Y";
        KeyEvent[90] = "VK_Z";

        KeyEvent[415] = "VK_PLAY";
        KeyEvent[19] = "VK_PAUSE";
        KeyEvent[402] = "VK_PLAY_PAUSE";
        KeyEvent[413] = "VK_STOP";

        /*
	    KeyEvent.VK_PREV = 424;
        KeyEvent.VK_NEXT = 425;
        KeyEvent.VK_FAST_FWD = 417;
        KeyEvent.VK_REWIND = 412;
        KeyEvent.VK_INFO = 457;
        KeyEvent.VK_SUBTITLE = 460;
        KeyEvent.VK_BACK = 461;

        KeyEvent.VK_VOLUME_UP = 447;
        KeyEvent.VK_VOLUME_DOWN = 448;
        KeyEvent.VK_MUTE = 449;
		*/

        KeyEvent[403] = "VK_RED";
        KeyEvent[404] = "VK_GREEN";
        KeyEvent[405] = "VK_YELLOW";
        KeyEvent[406] = "VK_BLUE";
        KeyEvent[407] = "VK_GREY";
        KeyEvent[408] = "VK_BROWN";

        function bindKeyboardEvents() {
            document.addEventListener("keydown", function (e) {
                var name = KeyEvent[e.keyCode];
                if (name) {
                    Magicaster.triggerGlobalEvent("keydown_ " + name);
					
                    //DONT'T DO THIS...PREVENTS PAGE SCROLLING USING ARROWS
                    //e.preventDefault();
                }
            }, false);
            document.addEventListener("keyup", function (e) {
                var name = KeyEvent[e.keyCode];
                if (name) {
                    Magicaster.triggerGlobalEvent("keyup_ " + name);
					
                    //DONT'T DO THIS...PREVENTS PAGE SCROLLING USING ARROWS
                    //e.preventDefault();
                }
            }, false);
        }

        return {
           // KeyEvent: KeyEvent,
            bindKeyboardEvents: bindKeyboardEvents
        };

    })();

    return KeyEvents;
});