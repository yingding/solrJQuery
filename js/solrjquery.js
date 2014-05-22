/**
* @author yingding wang
* this library has dependency to jquery and jquery-ui
* please load this two js lib first
*/

/**
* Backend Object for Ajax
*/
function SolrBackend(endpoint) {
   this._endpoint = endpoint;
}
SolrBackend.prototype = {
  endpoint : function() {
      return this._endpoint;
  }  
};
// example callback
var callbackExample1 = function(solrResponse) {
   var searchResultParentId = "resultParent";
   var searchResultElement = $('#'+searchResultParentId);
   if (!searchResultElement.length) {
       $('#'+searchResultParentId).append(solrResponse.solrgetHtml5SearchResultString());
   } else {
       // empty first all children
       $('#'+searchResultParentId).empty();
       $('#'+searchResultParentId).append(solrResponse.solrgetHtml5SearchResultString());
   }    
};


/**
* a search widget will be added to the parent element
* @param pElementId: the parent element.
* @param callback: use the callback to handle a SolrResponse Object
*/
function initWidget(pElementId,sWidgetId,solrBackend ,callback) {
      var searchWidget = $("#" + sWidgetId);
      if (! searchWidget.length) {
          searchWidget = new SearchWidget(sWidgetId);
          $("#" + pElementId).append(searchWidget.html5());
          // register onclick
          registerAjax(searchWidget, solrBackend, callback);
      }
      /*else {
          console.log("searchWidget: " + sWidgetId + " is already defined");
      }*/
}

/**
* @param searchWidget: object searchWidget
*/
function registerAjax(searchWidget, solrBackend, callback) {
   var submitId = searchWidget.submitId();
   //$("#"+submitId).on('click', function(evt){
   $("#"+submitId).click(function(evt){
       var inputElementValue = $("#" + searchWidget.inputId()).val();
       callAjax(inputElementValue, solrBackend,callback);
   });
}

function callAjax(inputValue,solrBackend, callback){
   $.ajax({
       url: solrBackend.endpoint(), /*URL des Solr-Cores*/
       /*Request-Parameter für Solr*/
       data: {
            /*Abfrage, kann ein String sein oder eine Funktion, die einen String liefert*/
              q: function() {
                  return "content:" + inputValue;
                  },
              wt: "json", /*Format der Antwort, xml geht auch*/
                  //"facet": "true", /*Facettierte Suche an oder aus*/
                  //"facet.mincount" : 1, /*Nur Facetten mit mindestens dem Wert 1*/
                  //"facet.field" : ["Hallo","Tralitrala"], /*Liste der Felder, also der Dimensionen der Facetten*/
                  //"facet.limit" : 15, /*max. Anzahl der Facetten*/
                  //"facet.range" : "Timestamp", /*Definition einer Eange-Facette, eine Dimension, die einen weiten Wertebereich abdeckt, z.B. die Zeit, wird in einzelne Portionen aufgeteilt, z.B. Tage, und über die dann aggregiert*/
                  //"f.Timestamp.facet.range.start": $("#facetDate").facetDateSelector("getRangeStart"), /*Anfang der Range-Facette*/
                  //"f.Timestamp.facet.range.end": $("#facetDate").facetDateSelector("getRangeEnd"), /*Ende der Range-Facette*/
                  //"f.Timestamp.facet.range.gap": $("#facetDate").facetDateSelector("getRangeGap"), /*Schrittweite*/
                  //"f.Timestamp.facet.mincount": 0, /*facet.mincount kann auch für jede einzelne Facette festgelegt werden*/
              sort: "id desc", /*Sortiering, mehrere Felder nach wichtigkeit absteigend nennbar*/
                     start: 0,
                     rows: 20 /*Anzahl der zu liefernden Einträge*/
       },
       /*Hier noch ein paar Parameter für jQuery selbst*/
       traditional: true, /*Art der Serialisierung der Daten, hab vergessen warum man das braucht*/
       error: function(jqXHR,textStatus,errorThrown){
               /*Fehler-Callback*/
               console.log(jqXHR.responseText);
               console.log(textStatus);
               console.log(errorThrown);
              },
       success: function(data,textStatus,jqXHR){
                /*Erfolgscallback, hier irgendwas sinnvolles mit "data" tun, data ist einfach eine Liste von Objekten*/
                solrResponseHandler(data,callback);
                }
       });
}


/**
* @param data: unformated json data from solr response
* @param callback:
*/
function solrResponseHandler(data, callback) {
   // Wrap the json response to a js object
   var result = $.parseJSON(data);
   // var result = JSON.parse(data);
   var responseHeader = new SolrResponseHeader(result["responseHeader"]);
   var responseBody = new SolrResponseBody(result["response"]);
   callback(new SolrResponse(responseHeader, responseBody));
}

function SolrResponse(responseHeader, responseBody) {
   this._responsHeader = responseHeader;
   this._responseBody = responseBody;
}

SolrResponse.prototype = {
   getNumFound : function() {
       return this._responseBody.numFound();
   },
   getSearchResultArray : function() {
       return this._responseBody.docs();
   },
   getHtml5SearchResultString : function() {
       var string = "<table>";
       string += "<tr><td>Gefunden: "+ this.getNumFound() +"</td></tr>";
       var resultLength = this.getSearchResultArray().length;
       var singleSearchResult;
       for(var i = 0; i< resultLength; i++) {
           singleSearchResult = (this.getSearchResultArray())[i];
           // (this.getSearchResultArray())[i] is an SolrSingleSearchResult object
           string += "<tr><td>URL: "+ singleSearchResult.url() +"</td></tr>";
           string += "<tr><td>Content: "+ singleSearchResult.content() +"</td></tr>";
           string += "<tr><td></td></tr>"; // blank as divider
       }    
       string += "</table>";
       return string;
   }
};


/**
* SolrResponseHeaderParams Object
* @param params: an init js variable with property "indent", "q", "_", "wt".
*/
function SolrResponseHeaderParams(params) {
   this._name = "responseHeaderParams";
   this._indent = params.indent;
   this._q = params.q;
   this._ = params["_"];
   this._wt = params.wt;
}
SolrResponseHeaderParams.prototype = {
   indent : function () {
     return this._indent;  
   },
   q : function () {
       return this._q;
   },
   _ : function () {
       return this["_"];
   },
   wt : function () {
       return this._wt;
   },
   name : function() {
       return this._name;
   }
};
/**
* SolrResponseHeader Object
* @param responseHeader: use responseHeader property from the solr json to initialize this object
*/
function SolrResponseHeader(responseHeader) {
   this._name = "responseHeader";
   this._status = responseHeader["status"];
   this._QTime = responseHeader["QTime"];
   this._params = new SolrResponseHeaderParams(responseHeader["params"]);
}
SolrResponseHeader.prototype = {
   name: function() {
       return this._name;
   },
   status: function() {
       return this._status;  
   },
   QTime: function() {
       return this._QTime;
   },
   params : function() {
       return this._params;
   }
};

function SolrResponseBody(response) {
   this._name = "response";
   this._numFound = response["numFound"];
   this._start = response["start"];
   this._docs = this.init(response["docs"]); // docs is an array object
}
SolrResponseBody.prototype = {
   name : function() {
      return this._name;
   },
   numFound : function() {
       return this._numFound;
   },
   start : function() {
       return this._start;
   },
   docs : function() {
       // return an array object of SolrSingleSearchResult
       return this._docs;
   },
   init : function(docs) {
       var d = new SolrDocs();
       return d.init(docs);
   }
};

function SolrDocs() {
   this._docs = [];
}
SolrDocs.prototype = {
   docs : function () {
       // returns an array object
       return this._docs;
   },
   init : function (docs) {
       //docs is an array from the solr json response
       if ($.isArray(docs)) { // testing if docs is an array
           for(var id in docs ) {
               // push the input element as a new SolrDocsEntry to the _docs array.
               this._docs.push(new SolrSingleSearchResult(docs[id]));
               
           }
       }
       return this._docs;
   }
};

function SolrSingleSearchResult(docsEntry) {
   this._name = "singleSearchResult";
   this._content2 = docsEntry["content"];
   this._title = docsEntry["title"];
   this._segment = docsEntry["segment"];
   this._boost = docsEntry["boost"];
   this._digest = docsEntry["digest"];
   this._tstamp = docsEntry["tstamp"];
   this._id = docsEntry["id"];
   this._url = docsEntry["url"];
   this._anchor = docsEntry["anchor"]; // anchor is an array, and it will be assigned directly
   this._version_ = docsEntry["_version_"];
}

SolrSingleSearchResult.prototype = {
   name : function() {
       return this._name;  
   },
   content : function() {
       return this._content2;
   },
   title : function() {
       return this._title;
   },
   segment : function() {
       return this._segment;
   },
   boost : function() {
       return this._boost;  
   },
   digest : function() {
       return this._digest;
   },
   tstamp : function() {
       return this._tstamp;
   },
   id : function() {
       return this._id;
   },
   url : function() {
       return this._url;
   },
   anchor : function() { // returns an unformatted array
       return this._anchor;
   },
   version : function() {
       return this._version_;
   }
};

/**
* SearchWidget Object
* @param id: optional unique id, if not given the SearchWidget will have default id "lmu_search"
*/
function SearchWidget(id) {
 this._id = id || "lmu_search"; // id for form
 this._extInput ="_input";
 this._extSubmit = "_submit";
 this._tag = "Search:";
 //this._submitClass = "lmu_search_submit";
 this._html5 =
 //"<div class=\"ui-widget\">"+
 "<form action=\"#\" id=" + this._id +">"+
 //"<form id=" + this._id +">"+
 "<label for=" + this.inputId() +">" + this._tag + "<\/label>" +
 "<input type=\"text\" id=" + this.inputId() + ">" +
 "<input type=\"submit\" value=\"senden\" id=" + this.submitId() + ">" +
 "<\/form>";
 //"<\/div>";
}
SearchWidget.prototype = {
   html5 : function () {
       return this._html5;
   },
   submitClass : function () {
       return this._submitClass;
   },
   inputId : function() {
       return this._id + this._extInput;  
   },
   submitId : function() {
       return this._id + this._extSubmit;
   },
   formId : function() {
       return this._id;
   }
};
