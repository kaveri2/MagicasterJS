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

define(["jquery",
        "utils/utils",
        "libs/xml2json",
        "libs/xmlwriter"],
    function ($, Utils) {
        "use strict";

        /**
         * Server connection object used for communicating with the Magicaster CMS.
         * @namespace Server
         */
        var Server = (function () {
            /** @lends server **/

            var sessionKey = "";
			try {
				sessionKey = sessionStorage["sessionKey"] ? sessionStorage["sessionKey"] : "";
			} catch(err) {
			}
            var firstRequest = true;
            var sessionConfirmed = false;

            // Default ajax settings
            var ajaxSettings = {
                dataType: "xml",
                type: "POST"
            };

            // Session key information
            var methodCallIndex = 0; // Rolling index of methodCalls
            var active = "true"; // According to windows focus and blur events

            var requestStarted = false;
            var bufferIntervalId = null;

            // XML Writer
            var xmlWriter = new XMLWriter('UTF-8');
            var x2js = new X2JS();

            var methodCalls = [];

            $(window).focus(function () {
                active = "true";
            });
            $(window).blur(function () {
                active = "false";
            });

            /*
             Example request structure
             <request>
             <sessionKey>{sessionKey}</sessionKey>
             <methodCall name="{methodName}" id="{index}">{data}</methodCall>
             <methodCall name="{methodName}" id="{index}">{data}</methodCall>
             </request>
             */

            function processEvent(event) {
                var properties = {
                    'name': event._name,
                    'data': event
                };
               /**
                * Fired when server sends event to client
                * @event
                * @name magicaster_serverEvent
                * @param name {string} Event name
                * @param data {object} Event data
                */
                Utils.dispatchEvent("magicaster_serverEvent", properties);
               /**
                * Fired when server sends event to client
                * @event
                * @name magicaster_serverEvent_[eventName]
                * @param name {string} Event name
                * @param data {object} Event data
                */
                Utils.dispatchEvent(("magicaster_serverEvent_" + event._name).replace(".", "_"), properties);
            }

            function startRequest() {
                xmlWriter.writeStartDocument();
                xmlWriter.writeStartElement('request');
                requestStarted = true;
            }

            function endRequest() {
                xmlWriter.writeStartElement('sessionKey');
                xmlWriter.writeString(sessionKey);
                xmlWriter.writeEndElement();

                xmlWriter.writeEndElement(); // </request>
                xmlWriter.writeEndDocument();
                requestStarted = false;
                return xmlWriter.flush();
            }

            function findMethodReturnById(response, id) {
                if (response.methodReturn) {
                    // methodReturn can be either single object or an array
                    if (_.isArray(response.methodReturn)) {
                        return _.find(response.methodReturn, function (methodReturn) {
                            if ("" + methodReturn._id === "" + id) {
                                return methodReturn;
                            }
                        });
                    }
                    else {
                        if ("" + response.methodReturn._id === "" + id) {
                            return response.methodReturn;
                        }
                    }
                }
            }

            /**
             * Adds server method to the buffer and starts buffer timer (if not started already).
             * @name Server#callMethod
             * @public
             * @method
             * @param {String} methodName Name of the backend method
             * @param {Object} parameters Parameter data in JSON format
             * @returns {Object} jQuery Promise for asynchronous response
             */
            function callMethod(methodName, parameters) {
                Magicaster.console.log("[Server] callMethod", methodName, parameters);
                var promise = callMethodDelayed(methodName, parameters);
                if (sessionConfirmed || firstRequest) {
                    startBufferTimer();
                }
                return promise;
            }

            /**
             * Adds server method to the buffer.
             * @name Server#callMethodDelayed
             * @public
             * @method
             * @param {String} methodName Name of the backend method
             * @param {Object} parameters Parameter data in JSON format
             * @returns {Object} jQuery Promise for asynchronous response
             */
            function callMethodDelayed(methodName, parameters) {
                Magicaster.console.log("[Server] callMethodDelayed", methodName, parameters);

                var d = $.Deferred();

                if (!requestStarted) {
                    startRequest();
                }

                methodCallIndex += 1;
                xmlWriter.writeStartElement('methodCall');
                xmlWriter.writeAttributeString('name', methodName);
                xmlWriter.writeAttributeString('id', methodCallIndex.toString());
                _.each(parameters, function (value, key, list) {
                    xmlWriter.writeStartElement(key);
                    if (value) {
                        xmlWriter.writeString(value.toString());
                    }
                    xmlWriter.writeEndElement();
                });
                xmlWriter.writeEndElement();

                methodCalls.push({
                    id: methodCallIndex,
                    name: methodName,
                    deferred: d
                });

                return d.promise();
            }

            /**
             * Adds server method to the buffer and sends the buffer immediately to the backend.
             * @name Server#callMethodImmediate
             * @public
             * @method
             * @param {String} methodName Name of the backend method
             * @param {Object} parameters Parameter data in JSON format
             * @returns {Object} jQuery Promise for asynchronous response
             */
            function callMethodImmediate(methodName, parameters) {
                Magicaster.console.log("[Server] callMethodImmediate", methodName, parameters);
                var promise = callMethodDelayed(methodName, parameters);
                if (sessionConfirmed || firstRequest) {
                    send(endRequest());
                }
                return promise;
            }

            /**
             * Sends the buffer immediately to the backend.
             * @name Server#sendRequest
             * @public
             * @method
             */
            function sendRequest() {
                Magicaster.console.log("[Server] sendRequest");
                if (sessionConfirmed || firstRequest) {
                    // create empty request if nothing is pending
                    if (!requestStarted) {
                        startRequest();
                    }
                    send(endRequest());
                }
            }

            function startBufferTimer() {
                if (bufferIntervalId) {
                    return;
                }
                var time = Math.floor(Magicaster.configuration.server.bufferTime * 1000);
                Magicaster.console.log("[Server] startBufferTimer", time);
                bufferIntervalId = setTimeout(function () {
                    send(endRequest());
                    bufferIntervalId = null;
                }, time);
            }

            function cancelBufferTimer() {
                if (bufferIntervalId) {
                    clearTimeout(bufferIntervalId);
                    bufferIntervalId = null;
                }
            }

            function send(data) {
			
				if (!Magicaster.configuration.server.url) {
					firstRequest = false;
					cancelBufferTimer();
					methodCalls = [];
					return;
				}
			
                Magicaster.console.log("[Server] send", data);

                firstRequest = false;
                cancelBufferTimer();

                var pendingMethodCalls = methodCalls;
                methodCalls = [];

                ajaxSettings.data = data;
                ajaxSettings.url = Magicaster.configuration.server.url;
                $.ajax(ajaxSettings)
                    .done(function (returnData) {
                        Magicaster.console.log("[Server] ajax done", returnData);

                        var parsedXML = x2js.xml2json(returnData);
                        var response = parsedXML.response;

                        if (response) {

                            if (response.sessionKey) {
                                if (sessionConfirmed) {
								   /**
									* Fired when server session expires
									* @event
									* @name magicaster_serverSessionContinued
									*/
                                    Utils.dispatchEvent("magicaster_serverSessionExpired");
                                } else {
								   /**
									* Fired when server session continues (browser has created the session before)
									* @event
									* @name magicaster_serverSessionContinued
									*/
                                    Utils.dispatchEvent("magiacster_serverSessionCreated");
                                }
								sessionKey = response.sessionKey;
								try {
									sessionStorage["sessionKey"] = sessionKey;
								} catch(err) {
								}
                            }
                            else if (!sessionConfirmed) {
							   /**
								* Fired when server session continues
								* @event
								* @name magicaster_serverSessionContinued
								*/
                                Utils.dispatchEvent("magicaster_serverSessionContinued");
                            }

                            if (response.event) {
                                // event can be either single object or an array
                                if (_.isArray(response.event)) {
                                    return _.find(response.event, function (event) {
                                        processEvent(event);
                                    });
                                }
                                else {
                                    processEvent(response.event);
                                }
                            }

                            while (pendingMethodCalls.length) {
                                var methodCall = pendingMethodCalls.shift();
                                var methodReturn = findMethodReturnById(response, methodCall.id);
                                if (methodReturn) {
                                    methodCall.deferred.resolve(methodReturn);
                                }
                            }

                            // all methodCalls that did not receive methodReturns will fail
                            while (pendingMethodCalls.length) {
                                pendingMethodCalls.shift().deferred.reject();
                            }

                            // the first successful request always confirms session
                            if (!sessionConfirmed) {
                                sessionConfirmed = true;

                                // when session has been confirmed, send any pending requests
                                if (requestStarted) {
                                    send(endRequest());
                                }
                            }

                        }
                        // response not received = server error
                        else {
                            // all methodCalls failed
                            while (pendingMethodCalls.length) {
                                pendingMethodCalls.shift().deferred.reject();
                            }

                           /**
							* Fired when server encounters an error
							* @event
							* @name magicaster_serverError
							*/
							Utils.dispatchEvent('magicaster_serverError');
                        }

                    })
                    .fail(function (error) {
                        Magicaster.console.log("[Server] ajax fail", error);

                        // all methodCalls failed
                        while (pendingMethodCalls.length) {
                            pendingMethodCalls.shift().deferred.reject(error);
                        }

                        Utils.dispatchEvent('magicaster_serverError');
                    });
            }

            return {
                callMethod: callMethod,
                callMethodDelayed: callMethodDelayed,
                callMethodImmediate: callMethodImmediate,
                sendRequest: sendRequest
            };

        })();

        return Server;
    });