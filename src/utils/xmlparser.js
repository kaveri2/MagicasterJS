/**
 * Created with IntelliJ IDEA.
 * User: Jarno
 * Date: 26.8.2013
 * Time: 12:26
 * To change this template use File | Settings | File Templates.
 */
define(function (require) {
    "use strict";
    require("libs/xml2json");
    var $ = require("jquery");

    var XMLParser = (function () {

        function parse(file) {
            var d = $.Deferred();
            $.ajax({url: file, dataType: "text", cache: false}).done(function (resp) {
                var x2js = new X2JS();
                var xml = resp.replace(/>\s*</g,'><');
                try {
                    var json = x2js.xml_str2json(xml);
                    d.resolve(json);
                }
                catch (e) {
                    Magicaster.console.error("EXCEPTION IN XML PARSING");
                    Magicaster.console.error(e);
                    d.reject(e);
                }

            }).fail(function (e) {
                    Magicaster.console.error("xml loading failed");
                    d.reject(e);
                });
            return d.promise();
        }

        function parseXmlDataAsync(xmlData) {
            var d = $.Deferred();
            var x2js = new X2JS();
            var json = x2js.xml_str2json(xmlData);
            d.resolve(json);
            return d.promise();
        }

        function parseXmlData(xmlData) {
            var x2js = new X2JS();
            return x2js.xml_str2json(xmlData);
        }

        return{
            parseAsync: parse,
            parseXmlData: parseXmlData,
            parseXmlDataAsync: parseXmlDataAsync
        };
    })();

    return XMLParser;
});