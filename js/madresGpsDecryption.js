function decipher(encryptedString, password) {
    var key = CryptoJS.enc.Utf8.parse(password);
    var decrypted = CryptoJS.AES.decrypt(encryptedString, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    } );
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function decrypt() {
    var code = document.getElementById("password").value;
    var encrypted = document.getElementById("encryptedContent").value.split(/\r?\n/);
    // first find out how many items are in the input
    if (encrypted.length==1) {
        var decrypted = [decipher(encryptedString=encrypted.toString(), password=code)];
    } else if (encrypted.length>1) {
        var decrypted = [];
        for (var i = 0; i < encrypted.length; i++){
            decrypted.push(decipher(encryptedString=encrypted[i].toString(), password=code))
        }
    } else {
        var decrypted = [];
    }
    if (decrypted.length==1) {
        document.getElementById("decryptedContent").value = decrypted;
    } else if (decrypted.length>1) {
        document.getElementById("decryptedContent").value = decrypted.join("\n");
    } else {
        document.getElementById("decryptedContent").value = "Invalid Input";
    }
}

function decode(inputFile) {
    var code = document.getElementById("password").value;
    var fileUpload = document.getElementById(inputFile);
    var reader = new FileReader();
    reader.readAsText(fileUpload.files[0]);

    reader.onload = (function(f) {
        return function(event) {
            var csv  = event.target.result;
            data = [];
            Papa.parse(csv, {
                step:function(results, parser) {
                    data.push(results.data[0]);
                }
            });
            result = decryptFile(data);
            download(contentToDownload = result, originalFileName = f.name);
        }
    })(fileUpload.files[0]) // wrapping onload function in another function, so the closure gives access to file name

    function decryptFile(input) {
        function plusToNum(x) {
            if (x == "+") {
                return(1);
            } else {
                return(0);
            }
        }
        var output = [["subjectID", "string_time", "date", "time", "timestamp", "source", "latitude", "longitude", "accuracy", "altitude", "velocity", "sat_inUse", "sat_inView", "wifi_on", "wifi_conencted", "network_on", "network_connected"]];
        var subjectID = "";
        for (var i = 0; i < input.length; i++) {
            var inputX = input[i];
            var entryX = [];
            if (inputX[1]=="SubjectID") {subjectID = inputX[2]}
            if (inputX[1]=="Tracking") {
                entryX.push(subjectID); // ID
                entryX.push(inputX[0]); // datetime
                entryX.push(inputX[0].split(" ")[0]) // date
                entryX.push(inputX[0].split(" ")[1]) // time
                entryX.push(inputX[3]); // timestamp
                recodeX = decipher(encryptedString=inputX[2].toString(), password=code);
                segX = recodeX.split(" ");
                if (recodeX.includes("network")) {
                    entryX.push("network");
                    entryX.push(segX[1].split(",")[0]);
                    entryX.push(segX[1].split(",")[1]);
                    entryX.push(segX[2].replace("acc=", ""));
                    entryX.push("", "", "", "");
                    entryX.push(plusToNum(inputX[4].substring(4, 5)));
                    entryX.push(plusToNum(inputX[4].substring(5, 6)));
                    entryX.push(plusToNum(inputX[5].substring(7, 8)));
                    entryX.push(plusToNum(inputX[5].substring(8, 9)));
                } else {
                    entryX.push("gps");
                    entryX.push(segX[1].split(",")[0]);
                    entryX.push(segX[1].split(",")[1]);
                    entryX.push(segX[2].replace("acc=", ""));
                    entryX.push(segX[4].replace("alt=", ""));
                    entryX.push(segX[5].replace("vel=", ""));
                    entryX.push(inputX[4]);
                    entryX.push(inputX[5]);
                    entryX.push("", "", "", "");
                }
            }
            if (entryX.length > 0) {output.push(entryX)}
        }
        return output;
    }

    function download(contentToDownload, originalFileName) {
        newFileName = originalFileName.split(".csv")[0]+"_decoded.csv";

        content = [];
        contentToDownload.forEach(function(infoArray, index){
           dataString = infoArray.map(function(item) {return '"' + item + '"'}).join(",") + "\n"; //wrap each item with quotes, then join
           content.push(dataString);
        });

        var file = new File(content, newFileName, {type: "text/csv;charset=utf-8"});
        saveAs(file);
        /*
        content = "data:text/csv;charset=utf-8,";
        contentToDownload.forEach(function(infoArray, index){
           dataString = infoArray.map(function(item) {return '"' + item + '"'}).join(","); //wrap each item with quotes, then join
           content += dataString + "\n";
        });

        var encodedUri = encodeURI(content);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", newFileName);
        document.body.appendChild(link); // Required for FireFox
        link.click()
        */
    }
}
