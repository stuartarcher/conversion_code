console.log("start conversion module");
  if(window.DataLayer){
console.log(window.DataLayer);
  }
else{
console.log("DataLayer not available");
}
  if(window.rm_trans){
console.log(window.rm_trans);
  }
else{
console.log("rm_trans not available");
}
	 // single variable for DataLayer Name
    // can be overridden with a window level variable.
    var dln = window.rakutenDataLayerName || 'DataLayer';

  
    // The readRMCookie function spilts the document.cookie apart and returns the value of 
    // the cookie with the key matching the name
    var readRMCookie = function(name) {

        var nameEQ = name + "=";
        var allCookies = document.cookie.split(';');

        for (var i = 0; i < allCookies.length; i++) {
            var ck = allCookies[i];
            while (ck.charAt(0) == ' ')
                ck = ck.substring(1, ck.length);
            if (ck.indexOf(nameEQ) == 0) {
                return ck.substring(nameEQ.length, ck.length);
            }
        }

        return "";
    };


    // The processRMStoreCookie function takes apart a string of format "key:value|key2:value2|..."
    // and returns it as an object {"key":"value", "key2":"value2",...}
    // if no string is passed to the function it reads the value of the rmStore cookie and uses this as input
    var processRMStoreCookie = function(str) {
        var rmStoreString = str || '';
        var rmStore = {};

        if (!str) {
            rmStoreString = readRMCookie('rmStore');
        }
        if (rmStoreString) {
            while (rmStoreString !== decodeURIComponent(rmStoreString)) {
                rmStoreString = decodeURIComponent(rmStoreString);
            }

            var rmCookArr = rmStoreString.split('|');

            for (var i = 0; i < rmCookArr.length; i++) {
                rmStore[rmCookArr[i].split(':')[0]] = rmCookArr[i].split(':')[1];
            }
        }

        return rmStore;
    };


    // pull the current rmStore value and store it in an object to be used in the readRMStoreValue function
    // this script is synchronous so no changes will happen to the rmStore unless they are made within this
    // function. There are none - so it is safe to simply digest the cookie once.
    var rmStore = {};
    rmStore = processRMStoreCookie();


    // the readRMStoreValue function is used to compare the rmStore values to config object values and finally assign a default
    // rmStore values take precedent over the configObj value. If neither are avialable the input defaultVal is used.
    //
    // rmStoreKey is used to look up a value from the rmStore
    // configObjKey is used to look up a value from the passed in configObj
    // the function returns the first non-false value of the rmStore value, configObj vlaue, and input defaultVal
    // if "ignoreCookie" is set in the config, the rmStore value is completely ignored.
    var readRMStoreValue = function(rmStoreKey, configObjKey, defaultVal, configObj) {

        defaultVal = defaultVal || "";
        configObj = configObj || {};

        var rmStoreVal = rmStore[rmStoreKey || ""],
            configVal = configObj[configObjKey || ""],
            ignoreCookie = configObj["ignoreCookie"] || false;

        rmStoreVal = ignoreCookie ? 0 : rmStoreVal;

        var returnVal = rmStoreVal || configVal || defaultVal;
        returnVal = (typeof(returnVal) === "string" && returnVal.toLowerCase() === "false") ? false : returnVal;

        return returnVal;
    };


    // the addElement function is used to add the script/iframe/img tags that the channel modules build up the src for.
    //
    // nodeType is the HTML tag node type (iframe, script or img)
    // src should be the URL the iframe/script/img will reference
    // appendLocation should be the node that the new element will be appended to. E.g for scripts this is usually the head.
    // attributes is an object of key/value pairs which are added as attributes to the node
    // loadCallback is a function wich will be called when the element has loaded
    var addElement = function(nodeType, src, appendLocation, attributes, loadCallback) {
        var node = document.createElement(nodeType);
        var protocol = document.location.protocol.indexOf("s") > -1 ? 'https:' : 'http:';
        src = src.replace('https:', protocol);

        node.src = src;
        attributes = attributes || {};

        if (nodeType == 'script') {
            attributes['type'] = attributes['type'] || 'text/javascript';
        } else {
            attributes['style'] = 'display:none;';
            if (nodeType == 'img') {
                attributes['alt'] = '';
                attributes['height'] = '1';
                attributes['width'] = '1';
            }
        }
        for (var attr in attributes) {
            if (attributes.hasOwnProperty(attr)) {
                node.setAttribute(attr, attributes[attr]);
            }
        }

        var appendElemTo = document.getElementsByTagName(appendLocation);
        // the appendToElemTo doesn't exist - this script has to exist so grab that instead
        if (!appendElemTo.length) {
            appendElemTo = document.getElementsByTagName('script')[0].parentElement;
        } else {
            appendElemTo = appendElemTo[0];
        }

        if (loadCallback) {
            node.onload = loadCallback;
            node.onreadystatechange = function() {
                if (this.readyState == "complete" || this.readyState == "loaded") {
                    loadCallback();
                }
            };
        }
        appendElemTo.appendChild(node);
    };

console.log("start RAN module");
  
    // The sRAN function builds up the affiliate img tag src url based on the DataLayer
    var sRAN = function() {
        var dl = (window[dln] && window[dln].Sale && window[dln].Sale.Basket) ? window[dln].Sale.Basket : {};
        var config = config || dl["affiliateConfig"] || {};

        /*
        Affiliate MID should be based in this order:
        1) ranMID cookie if it exists
        2) config.MID
        3) Basket.MID       
        */

        var merchantID = readRMStoreValue("amid", "ranMID", "", config) || dl["ranMID"];
        if (!merchantID) {
            return false;
        }

        var allowCommission = typeof(config["allowCommission"]) === "undefined" ? true : config["allowCommission"] === "false" ? false : true;
        if (!allowCommission) {
            return false
        }

        var domain = readRMStoreValue("adn", "domain", "track.linksynergy.com", config);
        var trackingMethod = readRMStoreValue("atm", "tagType", "pixel", config);
        var discountReporting = readRMStoreValue("adr", "discountType", "order", config);
        var includeCustomerStatus = readRMStoreValue("acs", "includeStatus", "false", config);
        var removeOrderLevelTax = readRMStoreValue("arto", "removeOrderTax", "false", config);
        var removeTaxFromProducts = readRMStoreValue("artp", "removeTaxFromProducts", "false", config);
        var removeTaxFromDiscount = readRMStoreValue("artd", "removeTaxFromDiscount", "false", config);
        var taxRate = readRMStoreValue("atr", "taxRate", (dl['taxRate'] || 0), config);
        var useCentValues = readRMStoreValue("acv", "centValues", "true", config);
        var land = readRMStoreValue('ald', 'land', false, {}) || (config["land"] && config["land"] === true ? readRMCookie("ranLandDateTime") : config["land"]) || false;
        var tr = readRMStoreValue('atrv', 'tr', false, {}) || (config["tr"] && config["tr"] === true ? readRMCookie("ranSiteID") : config["tr"]) || false;


        taxRate = Math.abs(Number(taxRate));
        var taxPercent = (100 + taxRate) / 100;

        var OrderID = encodeURIComponent(dl["orderid"] || "OrderNumberNotAvailable");
        var sku_list = "";
        var quantity_list = "";
        var itemvalue_list = "";
        var name_list = "";
        var currency = dl["currency"] || "";
        currency = encodeURIComponent(currency.toUpperCase());

        var multiplyBy100 = (useCentValues && useCentValues !== 'false') ? 100 : 1;

        var taxAmount = dl["taxAmount"] ? Math.abs(multiplyBy100 * Number(dl["taxAmount"])) : 0;
        var discountAmount = dl["discountAmount"] ? Math.abs(multiplyBy100 * Number(dl["discountAmount"])) : 0;
        var discountAmountLessTax = dl["discountAmountLessTax"] ? Math.abs(multiplyBy100 * Number(dl["discountAmountLessTax"])) : 0;


        if (!discountAmountLessTax && discountAmount && removeTaxFromDiscount && taxRate) {
            discountAmountLessTax = discountAmount / taxPercent;
        }
        discountAmountLessTax = discountAmountLessTax || discountAmount;


        var suffix = 'ep';
        if (trackingMethod === "mop") {
            suffix = "eventnvppixel";
        }

        var customerStatus = (dl["customerStatus"] || "") + "";
        var skuPrefix = "";
        if (customerStatus) {
            if (includeCustomerStatus && customerStatus.toUpperCase() == "EXISTING" || includeCustomerStatus && customerStatus.toUpperCase() == "RETURNING") {
                skuPrefix = "R_";
            }
        }

        var aggregatedLineItems = [];
        var totalSaleValue = 0;

        for (var i = 0; i < (dl["lineitems"] ? dl["lineitems"].length : 0); i++) {
            if (dl["lineitems"][i]) {
                var isDuplicateItem = false;
                var item = window.JSON ? JSON.parse(JSON.stringify(dl["lineitems"][i])) : dl["lineitems"][i];

                var itemQuantity = Number(item["quantity"]) || 0;
                var itemUnitPrice = Number(item["unitPrice"]) || 0;
                var itemUnitPriceLessTax = Number(item["unitPriceLessTax"]);

                var unitPriceLessTax = itemUnitPriceLessTax || itemUnitPrice || 0;
                if (removeTaxFromProducts && taxRate && !itemUnitPriceLessTax) {
                    unitPriceLessTax /= taxPercent;
                }

                var totalLineItemValue = itemQuantity * unitPriceLessTax;

                for (var j = 0; j < aggregatedLineItems.length; j++) {
                    var existing_item = aggregatedLineItems[j];

                    if (existing_item["SKU"] === item["SKU"]) {
                        isDuplicateItem = true;
                        existing_item["quantity"] += itemQuantity;
                        existing_item["totalValue"] += totalLineItemValue;

                    }
                }

                if (!isDuplicateItem) {
                    item["quantity"] = itemQuantity;
                    item["totalValue"] = totalLineItemValue;
                    aggregatedLineItems.push(item);
                }

                totalSaleValue += totalLineItemValue * multiplyBy100;
            }
        }


        var optionalDataLineItems = {};
        for (var i = 0; i < aggregatedLineItems.length; i++) {

            var item = aggregatedLineItems[i];

            var itemSKU = encodeURIComponent(item["SKU"]);
            var itemPrice = item["totalValue"] || item["totalValue"];
            var itemQuantity = item["quantity"];
            var itemName = encodeURIComponent(item["productName"]) || "";

            var totalItemAmount = itemPrice * multiplyBy100;

            if (discountReporting.toLowerCase() === "item" && discountAmountLessTax) {
                totalItemAmount -= (discountAmountLessTax * totalItemAmount) / totalSaleValue;
            }

            var optionalData = item.optionalData;
            for (var E in optionalData) {
                if (optionalData.hasOwnProperty(E)) {
                    optionalDataLineItems[E] = optionalDataLineItems[E] || "";
                    optionalDataLineItems[E] += encodeURIComponent(optionalData[E]) + "|";
                }
            }

            sku_list += skuPrefix + itemSKU + "|";
            quantity_list += itemQuantity + "|";
            itemvalue_list += Math.round(totalItemAmount) + "|";
            name_list += skuPrefix + itemName + "|";

        }

        sku_list = sku_list.slice(0, -1);
        quantity_list = quantity_list.slice(0, -1);
        itemvalue_list = itemvalue_list.slice(0, -1);
        name_list = name_list.slice(0, -1);

        // round discount and tax now as they will not be used in any further calculations.
        if (discountAmountLessTax) {
            discountAmountLessTax = Math.round(discountAmountLessTax);
        }

        if (taxAmount) {
            taxAmount = Math.round(taxAmount);
        }

        if (discountAmountLessTax && discountReporting.toLowerCase() === "order") {

            sku_list += "|" + skuPrefix + "DISCOUNT";
            name_list += "|" + skuPrefix + "DISCOUNT";
            quantity_list += "|0";
            itemvalue_list += "|-" + discountAmountLessTax;

        }

        if (removeOrderLevelTax && taxAmount) {

            sku_list += "|" + skuPrefix + "ORDERTAX";
            quantity_list += "|0";
            itemvalue_list += "|-" + taxAmount;
            name_list += "|" + skuPrefix + "ORDERTAX";

        }


        var imgUrl = "https://" + domain + "/" + suffix + "?mid=" + merchantID;
        imgUrl += "&ord=" + OrderID;
        imgUrl += "&skulist=" + sku_list;
        imgUrl += "&qlist=" + quantity_list;
        imgUrl += "&amtlist=" + itemvalue_list;
        imgUrl += "&cur=" + currency;
        imgUrl += "&img=1";
        imgUrl += '&spi=' + window[dln].events.SPIVersion;


        imgUrl += land ? "&land=" + land : '';
        imgUrl += tr ? "&tr=" + tr : '';


        if (discountAmountLessTax && discountReporting.toLowerCase() === "item") {
            imgUrl += "&discount=" + discountAmountLessTax;
        }

        var optionalData = dl.optionalData || {};

        if (dl["discountCode"]) {
            optionalData.coupon = dl["discountCode"];
        }

        if (dl["customerStatus"]) {
            optionalData.custstatus = dl["customerStatus"];
        }

        if (dl["customerID"]) {
            optionalData.custid = dl["customerID"];
        }

        if (discountAmountLessTax) {
            optionalData.disamt = discountAmountLessTax;
        }

        for (var E in optionalData) {
            if (optionalData.hasOwnProperty(E)) {
                imgUrl += "&" + encodeURIComponent(E) + "=" + encodeURIComponent(optionalData[E]);
            }
        }

        for (var E in optionalDataLineItems) {
            if (optionalDataLineItems.hasOwnProperty(E)) {
                imgUrl += '&' + encodeURIComponent(E) + "list=" + optionalDataLineItems[E].slice(0, -1);

                if (discountAmountLessTax && discountReporting.toLowerCase() === "order") {
                    imgUrl += '|';
                }

                if (taxAmount && removeOrderLevelTax) {
                    imgUrl += '|';
                }
            }
        }


        // namelist added at the end as it has lowest importance
        imgUrl += "&namelist=" + name_list;


        if (imgUrl[imgUrl.length - 1] === "&") {
            imgUrl = imgUrl.slice(0, -1);
        }

        if (imgUrl.length > 2037) {
            var n = 2037;

            while (n > 0) {
                if (imgUrl.charAt(n) == '&') {
                    imgUrl = imgUrl.slice(0, n);
                    break;
                } else {
                    n--;
                }
            }

            imgUrl += "&trunc=true";
        }

        addElement('img', imgUrl, 'body');
    };

  console.log("end RAN module");
  
// The sDisplay function builds up the display/mediaforge script/iframe/img tag src url based on the DataLayer
    var sDisplay  = function() {
        var dl = (window[dln] && window[dln].Sale && window[dln].Sale.Basket) ? window[dln].Sale.Basket : {};
        var config = config || dl["displayConfig"] || {};

        if (dl["orderid"] && dl["conversionType"]) {

            /*
            Display MID should be based in this order:
            1) rdMID cookie if it exists
            2) config.MID   
            */
    
            var merchantID = readRMStoreValue("dmid", "rdMID", "", config);
            if (!merchantID) {
                return false;
            }

            var tagType = readRMStoreValue("dtm", "tagType", "js", config);
            var domain = readRMStoreValue("ddn", "domain", "tags.rd.linksynergy.com", config);
            var includeCustomerStatus = readRMStoreValue("dis", "includeStatus", "false", config);
            var allowCommission = readRMStoreValue("dcomm", "allowCommission", "notset", config);
            var useUnitPrice = readRMStoreValue("duup", "useUnitPrice", "false", config);
            var removeTaxFromProducts = readRMStoreValue("drtp", "removeTaxFromProducts", "false", config);
            var removeTaxFromDiscount = readRMStoreValue("drtd", "removeTaxFromDiscount", "false", config);
            var taxRate = readRMStoreValue("dtr", "taxRate", (dl['taxRate'] || 0), config);
    
            var tvalid = "";
            // tvalid will only be set if allowCommission was explicitly set to 'true' or 'false' or '1' or '0'
            if (allowCommission === 'true' || allowCommission === true || allowCommission === '1' || allowCommission === 1) {
                tvalid = '1';
            } else if (allowCommission === 'false' || allowCommission === false || allowCommission === '0' || allowCommission === 0) {
                tvalid = '0';
            }

            // tagType is restircted to img, js or if. js is the defualt value for any unrecognised tagType
            tagType = (tagType === "js" || tagType === "if" || tagType === "img") ? tagType : "js";
            // work out the corresponding nodeType to the chosen tagType
            var nodeType = 'script';
            if(tagType === "if") {
                nodeType = 'iframe';
            } else if(tagType === "img") {
                nodeType = 'img';
            }
            
            // useUnitPrice should only be set if the config value is 'true', true , '1' or 1
            if (useUnitPrice === 'true' || useUnitPrice === true || useUnitPrice === '1' || useUnitPrice === 1) {
                useUnitPrice = true;
            }
    
            var customerStatus = (dl["customerStatus"] || "") + "";
            var orderPrefix = "";
            if (customerStatus && includeCustomerStatus && (customerStatus.toUpperCase() == "EXISTING" || customerStatus.toUpperCase() == "RETURNING")) {
                orderPrefix = "R_";
            }

            var orderNumber = encodeURIComponent(orderPrefix + dl["orderid"]);
            var currency = encodeURIComponent(dl['currency'] || '');
            var pageType = "conv";
            var totalSaleValue = 0;
            var productIDs = "";

            taxRate = Math.abs(Number(taxRate));
            var taxPercent = (100 + taxRate) / 100;

            var discountAmount = dl["discountAmount"] ? Math.abs(Number(dl["discountAmount"])) : 0;
            var discountAmountLessTax = dl["discountAmountLessTax"] ? Math.abs(Number(dl["discountAmountLessTax"])) : 0;

            if(!discountAmountLessTax && discountAmount && removeTaxFromDiscount && taxRate) {
                discountAmountLessTax = discountAmount / taxPercent;
            }

            discountAmountLessTax = discountAmountLessTax || discountAmount;
            discountAmountLessTax = isNaN(discountAmountLessTax) ? 0 : discountAmountLessTax;


            for (var i = 0; i < (dl["lineitems"] ? dl["lineitems"].length : 0); i++) {
                if(dl["lineitems"][i]) {
                    var itemQuantity = Number(dl["lineitems"][i].quantity);
                    var itemPrice = Number(dl["lineitems"][i].unitPriceLessTax) * itemQuantity;

                    if(!itemPrice || useUnitPrice) {
                        if(removeTaxFromProducts && taxRate) {
                            itemPrice = (Number(dl["lineitems"][i].unitPrice) / taxPercent) * itemQuantity;
                        } else {
                            itemPrice = Number(dl["lineitems"][i].unitPrice) * itemQuantity;
                        }
                    }

                    itemPrice = isNaN(itemPrice) ? 0 : itemPrice;

                    totalSaleValue += itemPrice;
                    productIDs += encodeURIComponent(dl["lineitems"][i]["SKU"]) + ",";
                }

            }

            totalSaleValue = Math.round(100 * (totalSaleValue - discountAmountLessTax)) / 100;
            productIDs = productIDs.slice(0, -1);


            var script_src = "https://" + domain + "/" + tagType + "/" + merchantID;
                script_src += '/?pt=' + pageType;
                script_src += "&orderNumber=" + orderNumber;
                script_src += '&spi=' + window[dln].events.SPIVersion;

            if(totalSaleValue) {
                script_src += "&price=" + totalSaleValue;
            }
            if(currency) {
                script_src += "&cur=" + currency;
            }
            if(tvalid) {
                script_src += "&tvalid=" + tvalid;
            }
            if(productIDs) {
                script_src += "&prodID=" + productIDs;
            }

            
            addElement(nodeType, script_src, 'body');
        }

    };


    // The sSearch function builds up the kenshoo script tag src and callback function based on the DataLayer
    var sSearch  = function() {
        var dl = (window[dln] && window[dln].Sale && window[dln].Sale.Basket) ? window[dln].Sale.Basket : {};
        var config = dl["searchConfig"] || {};

        var parameterLimit = 1024;
        var truncateAppend = encodeURIComponent('...TRUNCATED');

        /*
            Search MID should be based in this order:
            1) rsMID cookie if it exists
            2) config.MID  
        */

        var KenshooCustomerID = readRMStoreValue("smid", "rsMID", "", config);
        if (!KenshooCustomerID) {
            return false;
        }
        var KenshooAccountID = readRMStoreValue("said", "accountID", "113", config);
        var KenshooClickID = readRMStoreValue("sclid", "clickID", "", config);

        // get conversion type either from search config cookie, searchConfig datalayer or general conversionType datalayer variable, default is "conv"
        var conversionType = encodeURIComponent(readRMStoreValue("sct", "conversionType", dl.conversionType && (dl.conversionType + "").toLowerCase() !== "sale" ? dl.conversionType : "conv", config));

        var submitParameters = function() {
            var params = {};

            // Required Parameters (required by kenshoo)

            params.conversionType = conversionType;
            params.revenue = 0;
            params.currency = encodeURIComponent(dl.currency || "USD");

            // Optional Parameters

            params.orderId = encodeURIComponent(dl.orderid || ''); // STILL NEEDS GDPR LOGIC!
            params.promoCode = encodeURIComponent(dl.discountCode || "");

            if(KenshooClickID) {
                params.ken_gclid = encodeURIComponent(KenshooClickID);
            }

            // Custom Parameters

            params.discountAmount = Number(dl["discountAmount"] || 0);
            params.discountAmount = isNaN(params.discountAmount) ? 0 : Math.abs(params.discountAmount);
            params.customerStatus = encodeURIComponent(dl["customerStatus"] || "");
            params.productIDList = '';
            params.productNameList = '';
            // params.customerID = encodeURIComponent(dl["customerID"] || ""); // commented out for v3.3 due to time connstraints with GDPR logic


            if(dl.lineitems && dl.lineitems.length) {
                for (var i = 0; i < dl.lineitems.length; i++) {
                    if(dl.lineitems[i]) {
                        params.revenue += (Number(dl.lineitems[i].unitPrice || 0) * Number(dl.lineitems[i].quantity));
                        params.productIDList += (dl.lineitems[i].SKU || 'NA') + ',';
                        params.productNameList += (dl.lineitems[i].productName || 'NA')  + ',';
                    }
                }
                params.revenue = Math.round(100 * (params.revenue - params.discountAmount)) / 100; //this line resolves rounding issues

                params.productIDList = encodeURIComponent(params.productIDList.slice(0, -1));
                params.productNameList = encodeURIComponent(params.productNameList.slice(0, -1));

                //truncate productIDList and productNameList as the maximum character length is 1,024 for custom variables
                if (params.productIDList.length > parameterLimit) {
                    params.productIDList = params.productIDList.substring(0, parameterLimit - truncateAppend.length) + truncateAppend;
                }
                if (params.productNameList.length > parameterLimit) {
                    params.productNameList = params.productNameList.substring(0, parameterLimit - truncateAppend.length) + truncateAppend;
                }
            }

            kenshoo.trackConversion(KenshooAccountID, KenshooCustomerID, params);
        };


        var script_src = "https://services.xg4ken.com/js/kenshoo.js?cid=" + KenshooCustomerID;


        addElement('script', script_src, 'body', null, submitParameters);
    };

    // create an object in the DataLayer containing the functions defined
    // e.g window.DataLayer.SPI.sRAN
    window[dln]['SPI'] = {
        readRMCookie: readRMCookie,
        processRMStoreCookie: processRMStoreCookie,
        readRMStoreValue: readRMStoreValue,
        sRAN: sRAN,
        sDisplay: sDisplay,
        sSearch: sSearch,
        addElement: addElement,
        rmStore: rmStore
    };

    // trigger the modules
    sRAN();
    sDisplay();
    sSearch();
