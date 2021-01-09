/**
 * ABBREVIATIONS:
 * for shortenning variables names!
 * - CLF = classful
 * - CLS = classless
 * - LVL = level
 * - addr = address
 * - intrestOctind = intresting Octet Index
 *
 * CONVENTION:
 * - OCTETS stored inside arrays MUST always be in string format
 * - Single ADDRESSES variables MUST always be in array format
 * - MASK & PREFIX MUST be formated & validated at the start of their main scope
 * - thrown errors preceeded with the comment EXCEPTION aren't meant to be catched
 * - Dec Bin Hex converter Option | also possibility to hex & bin columns in displayed tables
 *
 * ADD:
 * - Warn user when he enters subnet or broadcast @ as unicast address
 * - Adopt OOP code
 * - save VLSM option
 *
 *
 * This code is owned by medilies and released under the GPL3 licence
 */

// GLOBAL MAPPING ARRAYS. helps relating prefixes and subnetmasks
const allPrefixes = [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [9, 10, 11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29, 30, 31, 32],
];
const maskDecimals = [128, 192, 224, 240, 248, 252, 254, 255];
// const maskBinaries = ["10000000","11000000","11100000","11110000","11111000","11111100","11111110","11111111"];

//******************
// FORMS ELEMENTS
//******************
const clfForm = document.querySelector("#js-clf-addressing");
const clfIp = document.querySelector("#js-clf-address");
const clfDiv = document.querySelector("#js-clf-info");

const clsForm = document.querySelector("#js-cls-addressing");
const clsIp = document.querySelector("#js-cls-address");
const clsPrefixOrMask = document.querySelector("#js-cls-mask-or-prefix");
const clsDiv = document.querySelector("#js-cls-info");
const clsClassLvlNeighborsDiv = document.querySelector(
    "#js-cls-neighbors-info"
);
const clsUpperPrefixesDiv = document.querySelector(
    "#js-cls-upper-prefixes-neighbors"
);

const vlsmForm = document.querySelector("#js-vlsm");
const vlsmSubnet = document.querySelector("#js-vlsm-network");
const vlsmInputs = document.querySelector("#js-vlsm-inputs");
const vlsmTemplateInput = document.querySelector("#vlsm-ref-input");
const vlsmChunksDiv = document.querySelector("#js-vlsm-chunks");

//*******************************************************
// FORMS SUBMISSION HANDLERS
//*******************************************************
clfForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clfDiv.innerHTML = "";

    let ip = clfIp.value.toString();

    try {
        ip = toArrayAddress(ip);

        ipv4RangeValidity(ip);

        const networkData = getClfIpData(ip);

        const subnetTable = subnetTableGen(networkData);
        clfDiv.innerHTML = subnetTable;
    } catch (err) {
        // console.error(err);
        if (typeof err == "string")
            if (err === "reserved class of IP")
                clfDiv.innerHTML =
                    "<p class='notice-text'>The given IPv4 address may be part of class E or class D reserved networks</p>";
            else if (
                err.includes("It may include an out of range [0-255] octet")
            )
                clfDiv.innerHTML = "<p class='alarming-text'>" + err + "</p>";
            // *
            else
                clfDiv.innerHTML =
                    "<p class='alarming-text'>INTERNAL ERROR, <a href='/contact.html' class='report-href' target='_blank'>Please report</a> this to us</p>";
        else
            clfDiv.innerHTML =
                "<p class='alarming-text'>INTERNAL ERROR, <a href='/contact.html' class='report-href' target='_blank'>Please report</a> this to us</p>";
    }
});

clsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clsDiv.innerHTML = "";
    clsClassLvlNeighborsDiv.innerHTML = "";
    clsUpperPrefixesDiv.innerHTML = "";

    let ip = clsIp.value.toString();
    let input = clsPrefixOrMask.value.toString();

    try {
        ip = toArrayAddress(ip);
        ipv4RangeValidity(ip);

        const { mask, prefix, intrestOctInd } = extractPrefixAndMask(input);

        /**
         * Each part has the 3 following main steps
         * - Get info
         * - Generate table
         * - Put table into the page
         */

        //-------------------------
        // Part ONE
        //-------------------------

        // cut the crap at 31 and 32 prefixes
        if ([31, 32].includes(prefix))
            throw `There is no info to get about the /${prefix} subnets`;

        const mainSubnetInfo = getClsIpData(ip, mask, intrestOctInd);
        const subnetTable = subnetTableGen(mainSubnetInfo);
        clsDiv.innerHTML = subnetTable;

        AlertClassDorE(mainSubnetInfo, clsDiv);

        //-------------------------
        // Part TWO
        //-------------------------

        // Same as if (classNeighboringSubnetsList !== "Main subnet is a class level subnet")
        if ([8, 16, 24].includes(prefix))
            throw "No class level neighbors to show";

        const classNeighboringSubnetsList = getClassNeighboringSubnets(
            toArrayAddress(mainSubnetInfo.subnetIp),
            mask,
            intrestOctInd
        );
        const classNeighboringSubnetsTable = classNeighboringSubnetsTableGen(
            classNeighboringSubnetsList,
            mainSubnetInfo.subnetIp
        );
        clsClassLvlNeighborsDiv.innerHTML =
            `<p>All the Possible /${prefix} subnets in ${
                classNeighboringSubnetsList[0].subnetIp
            }/${8 * parseInt(prefix / 8)} with their details</p>` +
            classNeighboringSubnetsTable;

        //-------------------------
        // Part THREE
        //-------------------------

        if ([0, 1, 8, 9, 16, 17, 24, 25].includes(prefix))
            throw "No prfix level neighbors to show";

        const prefixedNeighbors = getPrefixesNeighboringSubnets(
            toArrayAddress(mainSubnetInfo.subnetIp),
            prefix,
            mask,
            intrestOctInd
        );
        const upperPrefixNeighboringSubnetsTable = upperPrefixNeighboringSubnetsTableGen(
            prefixedNeighbors,
            mainSubnetInfo.subnetIp
        );
        clsUpperPrefixesDiv.innerHTML =
            `<p>Possible /${prefix} neighboring subnets on a varaition of larger prefixes</p>` +
            upperPrefixNeighboringSubnetsTable;
        //*
    } catch (err) {
        // console.error(err);
        if (typeof err == "string")
            if (err.includes("There is no info to get about the "))
                // thrown from main scope
                clsDiv.innerHTML = "<p class='notice-text'>" + err + "</p>";
            //*
            else if (err === "No class level neighbors to show") {
                clsClassLvlNeighborsDiv.innerHTML =
                    "<p class='notice-text'>This info field isn't available for /8 /16 /24 subnets</p>";
                clsUpperPrefixesDiv.innerHTML =
                    "<p class='notice-text'>This info field isn't available for /8 /16 /24 subnets</p>";
            }
            //*
            else if (err === "No prfix level neighbors to show")
                clsUpperPrefixesDiv.innerHTML =
                    "<p class='notice-text'>This info field isn't available for /9  /17 /25 subnets</p>";
            //*
            // thrown from functions
            else if (
                err.includes("It may include an out of range [0-255] octet")
            )
                clsDiv.innerHTML = "<p class='alarming-text'>" + err + "</p>";
            else if (err.includes("Out of bound prefix"))
                clsDiv.innerHTML = "<p class='alarming-text'>" + err + "</p>";
            else if (err.includes("invalid mask "))
                clsDiv.innerHTML = "<p class='alarming-text'>" + err + "</p>";
            // *
            else
                clsDiv.innerHTML =
                    "<p class='alarming-text'>INTERNAL ERROR, <a href='/contact.html' class='report-href' target='_blank'>Please report</a> this to us</p>";
        else
            clsDiv.innerHTML =
                "<p class='alarming-text'>INTERNAL ERROR, <a href='/contact.html' class='report-href' target='_blank'>Please report</a> this to us</p>";
    }
});

vlsmForm.addEventListener("submit", (e) => {
    e.preventDefault();
    vlsmChunksDiv.innerHTML = "";

    const cidrInput = vlsmSubnet.value.toString();

    try {
        const mainSubnet = mainSubnetData(cidrInput);

        if ([32, 31, 30].includes(mainSubnet.prefix)) throw "anti-vlsm prefix";

        netAddrValidty(
            mainSubnet.subnetIp,
            mainSubnet.intrestOctInd,
            blockSizeFromMask(mainSubnet.mask, mainSubnet.intrestOctInd),
            mainSubnet.prefix
        );

        const vlsmChuncks = vlsmChunksData([...mainSubnet.subnetIp]);

        const neededSize = vlsmChuncks.reduce((acc, curr) => {
            return (acc += parseInt(curr.blockSize));
        }, 0);

        const vlsmChunksTable = vlsmChunksTableGen(
            vlsmChuncks,
            mainSubnet.size
        );
        vlsmChunksDiv.innerHTML = vlsmChunksTable;

        AlertClassDorE(vlsmChuncks[vlsmChuncks.length - 1], vlsmChunksDiv);

        // notice
        if (neededSize > mainSubnet.size)
            throw `Main subnet capacity exceeded with ${
                neededSize - mainSubnet.size
            } addresses`;
        //*
    } catch (err) {
        // console.error(err);
        if (typeof err == "string")
            if (err.includes("anti-vlsm prefix"))
                // thrown from main scope
                vlsmChunksDiv.innerHTML =
                    "<p class='alarming-text'>VLSM can't be applied on /32, /31 and /30 subnets</p>";
            //*
            else if (err.includes("Main subnet capacity exceeded with "))
                vlsmChunksDiv.innerHTML +=
                    "<p class='alarming-text'>" +
                    err +
                    " (See used space & free space in red rows)</p>";
            //*
            // thrown from functions
            else if (err == "CIDR notation must include the / character")
                vlsmChunksDiv.innerHTML =
                    "<p class='alarming-text'>" + err + " </p>";
            //*
            else if (
                err.includes("It may include an out of range [0-255] octet")
            )
                vlsmChunksDiv.innerHTML =
                    "<p class='alarming-text'>" + err + " </p>";
            //*
            else if (err.includes("Out of bound prefix"))
                vlsmChunksDiv.innerHTML =
                    "<p class='alarming-text'>" + err + " </p>";
            //*
            else if (err.includes("Invalide network address"))
                vlsmChunksDiv.innerHTML =
                    "<p class='alarming-text'>" + err + " </p>";
            //*
            else
                vlsmChunksDiv.innerHTML =
                    "<p class='alarming-text'>INTERNAL ERROR, <a href='/contact.html' class='report-href' target='_blank'>Please report</a> this to us</p>";
        else
            vlsmChunksDiv.innerHTML =
                "<p class='alarming-text'>INTERNAL ERROR, <a href='/contact.html' class='report-href' target='_blank'>Please report</a> this to us</p>";
    }
});

vlsmInputs.addEventListener("click", vlsmAddRemoveCallback);

function warnNetOrBroadcastAddr() {
    // ...
}

function AlertReservetNet() {
    // ...
}

//*******************************************************
// GENERAL PURPOSE FUNCTIONS (the simplest ?)
//*******************************************************

/**
 * @param {string} address  formated as **"nb.nb.nb.nb"** or **"nb.nb.nb.nb/nb"**
 * @returns {string[]} address formated as **["nb","nb","nb","nb"]**
 */
function toArrayAddress(address) {
    // check if already formated as ["nb","nb","nb","nb"]
    if (Array.isArray(address) && address.length === 4) {
        console.warn("needless use for this function");
        return address;
    }
    // check if formated as "nb.nb.nb.nb/nb" then format it as "nb.nb.nb.nb"
    if (address.includes("/"))
        address = address.substr(0, address.indexOf("/"));
    // return "nb.nb.nb.nb" as ["nb","nb","nb","nb"]
    return address.split(".");
}

/**
 * @param {string | number} octet gets verified if within [0-255]
 */
function octetRangeIsValid(octet) {
    octet = parseInt(octet);
    if (octet >= 0 && octet <= 255) return true;
    return false;
}

/**
 * returns true or throw error
 * @param {string[]} address
 * @requires octetRangeIsValid() applied on every octet
 * @requires toArrayAddress() EXTRA! used in case address isn't string[]
 * @throws out of range octet
 */
function ipv4RangeValidity(address) {
    if (!Array.isArray(address)) address = toArrayAddress(address);

    if (
        !octetRangeIsValid(address[0]) ||
        !octetRangeIsValid(address[1]) ||
        !octetRangeIsValid(address[2]) ||
        !octetRangeIsValid(address[3]) ||
        address.length !== 4
    )
        throw `The address ${address} is invalid! It may include an out of range [0-255] octet's value, or not be formed of exactly 4 octets`;
}

/**
 * @param {string[]} mask
 * @throw invalid mask
 */
function ipv4MaskValidity(mask) {
    if (!Array.isArray(mask)) mask = toArrayAddress(mask);

    if (mask.length !== 4) throw `invalid mask ${mask}`;

    mask.forEach((octet) => {
        if (!maskDecimals.includes(parseInt(octet)))
            if (octet != 0) throw `invalid mask ${mask}`;
    });
}

/**
 * @param {number} prefix
 * @throws "Out of bound prefix"
 * @throws "Bad function use" when param isn't an interger string or number
 */
function prefixRangeValidty(prefix) {
    // exception
    if (isNaN(prefix)) throw "Bad function use";
    if (prefix > 0 && prefix < 33) return true;
    throw `Out of bound prefix ${prefix}`;
}

/**
 * @param {string[]} ip
 * @param {number} intrestOctInd
 * @param {number} blockSize **THE ONE OBTAINED FROM MASK**
 * @throws Invalide network address
 */
function netAddrValidty(ip, intrestOctInd, blockSize, prefix) {
    if (ip[intrestOctInd] % blockSize !== 0)
        throw `Invalide network address ${ip.join(".")} for /${prefix} prfix`;
    for (let i = 3; i > intrestOctInd; i--) {
        if (ip[i] != 0)
            throw `Invalide network address ${ip.join(
                "."
            )} for /${prefix} prfix`;
    }
}

/**
 * First octet from left that isnt set to 255 is the intresting octet
 * @param {array} mask
 */
function getIntrestOctIndFromMask(mask) {
    for (let i = 0; i <= 3; i++) {
        if (mask[i] !== "255" && mask[i] !== "0") return i;
        else if (mask[i - 1] === "255" && mask[i] === "0") return i - 1;
        else if (mask[i] === "255" && i === 3) return 3;
    }
    // exception
    throw "can't find intresting octet index";
}

/**
 * @param {number} prefix
 */
function getIntrestOctIndFromPreix(prefix) {
    return parseInt((prefix - 1) / 8);
}

/**
 * Gets block blocksize in the intresting octet, **Exemple:** 255.255.252.0 blocksize is 4 and not 1024
 *
 * **NOTE:** /8 /16 /24 /32 masks results in **blocksize === 1** because 256 - 255 = 1
 *
 * **=>** this behaviour is being exploited!
 *
 * @param {array} mask
 * @param {number} intrestOctInd
 */
function blockSizeFromMask(mask, intrestOctInd) {
    return 256 - mask[intrestOctInd];
}

/**
 * @param {number} prefix
 */
function blockSizeFromPrefix(prefix) {
    return Math.pow(2, 32 - prefix);
}

/**
 * Can be applied on any address (any prefix, any value ...)
 *
 * returns an array of addresses[] Subnet, First host, Last Host, Broadcast
 * @param {array} ip used to map all other returned addresses
 * @param {array} mask used to get block size
 * @param {number} intrestOctInd
 * @returns {string[] | number}
 */
function subnetMapping(ip, mask, intrestOctInd) {
    const blockSize = blockSizeFromMask(mask, intrestOctInd);

    const subnetIndex = parseInt(ip[intrestOctInd] / blockSize);

    const subnetIp = ip.map((octet, i) => {
        if (i === intrestOctInd) return (blockSize * subnetIndex).toString();
        if (i > intrestOctInd) return "0";
        return octet;
    });

    const broadcastIp = ip.map((octet, i) => {
        // next subnet -1
        if (i === intrestOctInd)
            return (blockSize * (subnetIndex + 1) - 1).toString();
        if (i > intrestOctInd) return "255";
        return octet;
    });

    const firstHost = subnetIp.map((octet, i) => {
        if (i === 3) return (parseInt(octet) + 1).toString();
        return octet;
    });

    const lastHost = broadcastIp.map((octet, i) => {
        if (i === 3) return (parseInt(octet) - 1).toString();
        return octet;
    });

    const availabeHosts = hostsPerSubnet(intrestOctInd, blockSize);

    return [subnetIp, firstHost, lastHost, broadcastIp, availabeHosts];
}

/**
 * Simple
 * used once in subnetMapping()
 * @param {number} intrestOctInd
 * @param {number} blockSize
 */
function hostsPerSubnet(intrestOctInd, blockSize) {
    switch (intrestOctInd) {
        case 0:
            return 16777216 * blockSize - 2;
        case 1:
            return 65536 * blockSize - 2;
        case 2:
            return 256 * blockSize - 2;
        case 3:
            return 1 * blockSize - 2;
        default:
            // exception
            throw "index of octet can't be larger then 3";
    }
}

/**
 * **Strips** the "/" from the prefix if its formated as "/nb"
 *
 * ALSO **varifies VALIDITY**
 *
 * May requires extra refactoring ?
 * @param {string | number} prefix
 * @requires prefixRangeValidty() (throws exception)
 * @returns {number} prefix
 */
function decimalPrefix(prefix) {
    if (Number.isInteger(prefix)) {
        if (prefixRangeValidty(prefix)) return prefix;
    }

    // Not a integer then MUST be "/nb" or "nb"
    if (prefix.includes("/")) prefix = prefix.substr(1);

    prefix = parseInt(prefix);

    if (prefixRangeValidty(prefix)) return prefix;
}

/**
 * Simple & requires the global mapping arrays
 * @param {number} prefix
 * @param {number} intrestOctInd
 */
function prefix2mask(prefix, intrestOctInd) {
    let mask;

    // preset the mask
    switch (intrestOctInd) {
        case 0:
            mask = ["0", "0", "0", "0"];
            break;
        case 1:
            mask = ["255", "0", "0", "0"];
            break;
        case 2:
            mask = ["255", "255", "0", "0"];
            break;
        case 3:
            mask = ["255", "255", "255", "0"];
            break;
        default:
            // exception
            throw "unexcpected intresting octet index value";
    }

    const mappingIndex = allPrefixes[intrestOctInd].indexOf(prefix);

    // last modification on the preset mask
    mask[intrestOctInd] = maskDecimals[mappingIndex].toString();

    return mask;
}

/**
 * Simple & requires the global mapping arrays
 * @param {array} mask
 * @param {number} intrestOctInd  gives index of the subneted octet [0|1|2|3]
 */
function mask2prefix(mask, intrestOctInd) {
    const mappingIndex = maskDecimals.indexOf(parseInt(mask[intrestOctInd]));

    const prefix = allPrefixes[intrestOctInd][mappingIndex];

    return prefix;
}

/**
 * Returns **VALID** mask & prefix
 * used when form input allows user to enter one option. PREFIX or MASK, and futur operations requires both
 * @param {string} input
 * @requires ipv4RangeValidity()
 * @requires getIntrestOctIndFromMask()
 * @requires mask2prefix()
 * @requires prefix2mask()
 * @throws "invalid values in mask"
 */
function extractPrefixAndMask(input) {
    let mask = [];
    let prefix;
    let intrestOctInd;

    // Mask
    if (input.length > 6) {
        ipv4MaskValidity(input);

        mask = toArrayAddress(input);
        intrestOctInd = getIntrestOctIndFromMask(mask);
        prefix = mask2prefix(mask, intrestOctInd);
    }
    // Prefix
    else if (input.length < 4) {
        prefix = decimalPrefix(input);
        intrestOctInd = getIntrestOctIndFromPreix(prefix);
        mask = prefix2mask(prefix, intrestOctInd);
    }
    // exception
    else throw "unexpected input length while extracting mask & prefix";

    return { mask, prefix, intrestOctInd };
}

/**
 * @param {string} firstOctet
 * @requires octetRangeIsValid()
 * @throws "invalide first octet" when first octet isn't in [0-255]
 */
function getClassOfIp(firstOctet) {
    firstOctet = parseInt(firstOctet);

    // exception
    if (!octetRangeIsValid(firstOctet)) throw "invalide first octet";

    if (firstOctet >= 0 && firstOctet <= 127) return "class A";
    if (firstOctet >= 128 && firstOctet <= 191) return "class B";
    if (firstOctet >= 192 && firstOctet <= 223) return "class C";
    if (firstOctet >= 224 && firstOctet <= 239) return "class D";
    if (firstOctet >= 240 && firstOctet <= 255) return "class E";
}

/**
 * From w3c JS docs
 * @param {string} dec
 */
function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}

/**
 * From w3c JS docs
 * @param {string} bin
 */
function bin2dec(bin) {
    return parseInt(bin, 2).toString(10);
}

/**
 *
 * @param {string | number} a
 * @param {string | number} b
 */
function addBin(a, b) {
    let sum = parseInt(a) + parseInt(b);
    return (sum >>> 0).toString(2);
}

/**
 * @param {number} size
 */
function prefixFromSize(size) {
    let hostsBits;
    for (let i = 0; i < 32; i++) {
        if (Math.pow(2, i) >= size) {
            hostsBits = i;
            break;
        }
    }
    return 32 - hostsBits;
}

/**
 * Returns **VALID** network address + prefix
 * @param {string} cidr "nb.nb.nb.nb/nb"
 * @requires toArrayAddress
 * @requires decimalPrefix
 * @requires ipv4RangeValidity throw error
 * @requires prefixRangeValidty throw error
 * @throw Cidr notation must include / character
 */
function cidrToSubnetAndPrefix(cidr) {
    if (cidr.includes("/")) cidr = cidr.split("/");
    else throw "CIDR notation must include the / character";

    const subnetIp = toArrayAddress(cidr[0]);
    const prefix = decimalPrefix(cidr[1]);
    ipv4RangeValidity(subnetIp);
    prefixRangeValidty(prefix);
    // won't use netAddrValidty() to avoid overwelming this function
    return { subnetIp, prefix };
}

/**
 * Checks if the given subnet touches class E or class D addresses and appends an elerting HTML text to the given HTML div
 * @param {*} subnet - **MUST** include the property **broadcastIp**
 * @param {Element} htmlAlertDiv
 */
function AlertClassDorE(subnet, htmlAlertDiv) {
    if (parseInt(toArrayAddress(subnet.broadcastIp)[0]) >= 224) {
        htmlAlertDiv.innerHTML += `<p class='alarming-text'>The subnet ${subnet.subnetIp} crosses class E or D IPv4 reserved pools</p>`;
    }
}
//*******************************************************
// HTML TABLE GENERATION  FUNCTIONS
//*******************************************************

/**
 * Used in for any single subnet (classless/classful)
 *
 * @param {*} info The object containning network or subnet data {Subnet, firstHost, lastHost, broadcast, available hosts ...}
 *
 * needs to include prefixe
 */
function subnetTableGen(info) {
    return `
    <table class='properties-table'>
        <tr>
            <th>${info.ipClass == undefined ? "Subnet" : "Network"} address</th>
            <td>${info.subnetIp}</td>
            </tr>
        <tr>
            <th>First host</th>
            <td>${info.firstHost}</td>
        </tr>
        <tr>
            <th>Last host</th>
            <td>${info.lastHost}</td>
        </tr>
        <tr>
            <th>Broadcast address</th>
            <td>${info.broadcastIp}</td>
        </tr>
        <tr>
            <th>Subnetmask</th>
            <td>${info.subnetMask}</td>
        </tr>
        ${
            info.ipClass == undefined
                ? ""
                : `<tr><th>Class</th><td>${info.ipClass}</td></tr>`
        }
        <tr>
            <th>Number of Availabe hosts</th>
            <td>${info.availabeHosts}</td>
        </tr>
    </table>`;
}

/**
 * @param {*} neighboringInfo
 * @param {string} mainSubnetAddr only used for deciding if table row needs to be highlighted
 */
function classNeighboringSubnetsTableGen(neighboringInfo, mainSubnetAddr) {
    let table = `<div class='scroll'><table class="long-table">
    <tr>
        <th></th>
        <th>Subnet address</th>
        <th>First host</th>
        <th>Last host</th>
        <th>Broadcast address</th>
    </tr>`;

    neighboringInfo.forEach((subnet, i) => {
        table += `
        <tr ${
            subnet.subnetIp === mainSubnetAddr
                ? "class='js-focused-subnet''"
                : ""
        }>
            <td>${i + 1}</td>
            <td>${subnet.subnetIp}</td>
            <td>${subnet.firstHost}</td>
            <td>${subnet.lastHost}</td>
            <td>${subnet.broadcastIp}</td>
        </tr>`;
    });

    table += "</table><div>";
    return table;
}

/**
 * The result table has "SubnetListsIterators.length"|"prefixedNeighbors.length" columns & "largestSubnetsList.length" rows
 *
 * a bit complexe to explain just debug it to understand
 *
 * @param {*} prefixedNeighbors [subnetsList: {subnets: string[], prefix: number}, ...]
 * @param {string} mainSubnetAddr only used for deciding if table row needs to be highlighted
 */
function upperPrefixNeighboringSubnetsTableGen(
    prefixedNeighbors,
    mainSubnetAddr
) {
    // empty in case the user inputed an address with 8,16,24 prefix!

    // exception
    if (prefixedNeighbors.length === 0) throw "Input is empty";

    prefixedNeighbors.reverse();
    // largest list is the one with with smallest prefix
    const largestSubnetsList = prefixedNeighbors[0].subnets;

    // [0,0,0...]
    const SubnetListsIterators = prefixedNeighbors.map(() => {
        return 0;
    });

    let table = "<div class='scroll'><table class='long-table'>";
    // headers row
    table += "<tr>";
    prefixedNeighbors.forEach((subnetsList) => {
        table += `<th>${subnetsList.subnets[0]}/${subnetsList.prefix}</th>`;
    });
    table += "</tr>";

    // CORE LOOP
    largestSubnetsList.forEach((subnet) => {
        table += `<tr ${
            subnet === mainSubnetAddr ? "class='js-focused-subnet''" : ""
        }>`;

        for (let i = 0; i < SubnetListsIterators.length; i++) {
            const currentSubnetsList = prefixedNeighbors[i].subnets;

            if (subnet === currentSubnetsList[SubnetListsIterators[i]]) {
                table += `<td>${subnet}</td>`;
                SubnetListsIterators[i]++;
            }
            //*
            else table += "<td></td>";
        }

        table += "</tr>";
    });

    table += "</table></div>";

    return table;
}

/**
 *
 * @param {*} chunksInfo object with all the info extracted about the chunks
 * @param {number} mainSubnetSize block size of the container subnet, used for deciding if table row needs to be highlighted
 */
function vlsmChunksTableGen(chunksInfo, mainSubnetSize) {
    let table = `<div class='scroll'><table class='long-table'>
    <tr>
        <th>Name</th>
        <th>Subnet address</th>
        <th>First host</th>
        <th>Last host</th>
        <th>Broadcast address</th>
        <th>Prefix</th>
        <th>Subnetmask</th>
        <th>Used space</th>
        <th>Free space</th>
    </tr>`;

    let outOfBoundDetector = 0;
    let outOfBound = false;

    chunksInfo.forEach((subnet) => {
        outOfBoundDetector += subnet.blockSize;
        if (outOfBoundDetector > mainSubnetSize) outOfBound = true;

        table += `
        <tr ${outOfBound ? "class='js-extra'" : ""}>
            <td>${subnet.subnetName}</td>
            <td>${subnet.subnetIp}</td>
            <td>${subnet.firstHost}</td>
            <td>${subnet.lastHost}</td>
            <td>${subnet.broadcastIp}<t/d>
            <td>${subnet.prefix}</td>
            <td>${subnet.mask}</td>
            <td>${subnet.subnetOccupation}</td>
            <td>${subnet.freeSpace}</td>
        </tr>`;
    });

    table += "</table></div>";

    return table;
}

//*******************************************************
// CASE SPECIFIC FUNCTIONS (called once)
//*******************************************************

/**
 * The main function in classful IP option
 *
 * Asselble related data in a meanningful object
 * @param {string[]} ip
 * @requires getClassOfIp()
 * @requires subnetMapping()
 * @throws "unexpected class of IP"
 */
function getClfIpData(ip) {
    let networkOctets;
    let availabeHosts;
    let mask;

    const ipClass = getClassOfIp(ip[0]);

    switch (ipClass) {
        case "class A":
            networkOctets = 0;
            availabeHosts = 16777214;
            mask = "255.0.0.0";
            break;
        case "class B":
            networkOctets = 1;
            availabeHosts = 65534;
            mask = "255.255.0.0";
            break;
        case "class C":
            networkOctets = 2;
            availabeHosts = 254;
            mask = "255.255.255.0";
            break;
        default:
            // exception
            throw "reserved class of IP";
    }

    const subnetMap = subnetMapping(ip, toArrayAddress(mask), networkOctets);

    return {
        subnetIp: subnetMap[0].join("."),
        firstHost: subnetMap[1].join("."),
        lastHost: subnetMap[2].join("."),
        broadcastIp: subnetMap[3].join("."),
        subnetMask: mask,
        ipClass: ipClass,
        availabeHosts: availabeHosts,
    };
}

/**
 * The main function in classless IP option
 *
 * Asselble related data in a meanningful object
 * @param {string[]} ip
 * @param {string[]} mask
 * @param {number} intrestOctInd
 * @requires subnetMapping() The only operation!
 */
function getClsIpData(ip, mask, intrestOctInd) {
    const subnetMap = subnetMapping(ip, mask, intrestOctInd);

    return {
        subnetIp: subnetMap[0].join("."),
        firstHost: subnetMap[1].join("."),
        lastHost: subnetMap[2].join("."),
        broadcastIp: subnetMap[3].join("."),
        subnetMask: mask.join("."),
        availabeHosts: subnetMap[4],
    };
}

/**
 * Assumes FIXED Length Subneting
 *
 * **EXAMPLE** main subnet is 192.168.1.112/29
 *
 * This function will return all /29 subnets contained within 192.168.1.0/24
 *
 * @param {string[]} mainSubnet
 * @param {string[]} mask
 * @param {number} intrestOctInd
 */
function getClassNeighboringSubnets(mainSubnet, mask, intrestOctInd) {
    if (mask[intrestOctInd] == "255")
        return "Main subnet is a class level subnet";

    const blockSize = blockSizeFromMask(mask, intrestOctInd);
    const currentSubnet = mainSubnet;
    const subnets = [];

    for (let theOctet = 0; theOctet < 256; theOctet += blockSize) {
        currentSubnet[intrestOctInd] = theOctet.toString();

        currentSubnetMap = subnetMapping(currentSubnet, mask, intrestOctInd);

        subnets.push({
            subnetIp: currentSubnetMap[0].join("."),
            firstHost: currentSubnetMap[1].join("."),
            lastHost: currentSubnetMap[2].join("."),
            broadcastIp: currentSubnetMap[3].join("."),
        });
    }
    return subnets;
}

/**
 * /8 /16 /24 prefixes causes inexpected behviour **(results blocksize of 1 ?)**
 *
 * LOCATES the larger subnet that wraps main subnet & its neighbors
 *
 * THEN return all the little subnets in strings array
 * @param {string[]} mainSubnet
 * @param {string[]} mainSubnetMask
 * @param {number} intrestOctInd
 * @param {number} targetPrefix values can be: **[1-7][9-15][17-23][25-30]**
 * @requires prefix2mask()
 * @requires blockSizeFromMask()
 * @throws classful problems
 */
function upperSubnetNeighbors(
    mainSubnet,
    mainSubnetMask,
    intrestOctInd,
    targetPrefix
) {
    // exception
    if ([8, 16, 24].includes(targetPrefix))
        throw "This function doesn't locate neighbors inside /8, /16 or /24";

    // exception
    if (mainSubnetMask[intrestOctInd] == "255")
        throw "This function doesn't locate neighbors for Class level subnets";

    // Locate the larger subnet that wraps the Main Subnet
    const targetMask = prefix2mask(targetPrefix, intrestOctInd);
    const targetBlockSize = blockSizeFromMask(targetMask, intrestOctInd);
    const parentSubnetIndex = Math.floor(
        mainSubnet[intrestOctInd] / targetBlockSize
    );

    // set Main Subnet blocksize to iterate with through neighbors
    const iterativeBlockSize = blockSizeFromMask(mainSubnetMask, intrestOctInd);

    // loop variables
    const currentSubnet = mainSubnet;
    let theOctet = targetBlockSize * parentSubnetIndex;
    const subnets = [];

    /**
     * EXAMPLE /28.blocksize===16 /26.blocksize===64 => 0:16:64
     *     192.168.1.[64,80,96,112]/28 indide 192.168.1.64/26
     */
    for (let i = 0; i < targetBlockSize; i += iterativeBlockSize) {
        currentSubnet[intrestOctInd] = theOctet.toString();

        subnets.push(currentSubnet.join("."));

        theOctet += iterativeBlockSize;
    }

    return { subnets: subnets, prefix: targetPrefix };
}

/**
 * Just wrap upperSubnetNeighbors() Results for larger prefixes in a array
 *
 * **EXAMPLE:** if the studied prefix is **28**, this function will loop with upperSubnetNeighbors() and get info of /27 /26 /25 focusing on the /28
 *
 * The **for loop** starts at studiedPrefix-1. That's why /1 /9 /17 /25 are excluded, Because 25-1=24 (24===stop prefix) => then the function retuns an **empty Array**
 *
 * Also /0 /8 /16 /24 are covered by **getClassNeighboringSubnets()**
 * @param {string[]} mainSubnetAddress
 * @param {number} prefix values can be: **[2-7][10-15][18-23][26-30]**
 * @param {string[]} mask
 * @param {number} intrestOctInd
 * @requires upperSubnetNeighbors()
 */
function getPrefixesNeighboringSubnets(
    mainSubnetAddress,
    prefix,
    mask,
    intrestOctInd
) {
    // exception
    if ([8, 16, 24].includes(prefix))
        throw "/8 /16 /24 can't be proceced for this function";

    // exception
    if ([1, 9, 17, 25].includes(prefix))
        throw "/1 /9 /17 /25 will results in returning an empty set";

    const stopPrefix = Math.floor(prefix / 8) * 8;
    const prefixedNeighbors = [];

    for (let i = prefix - 1; i > stopPrefix; i--) {
        const currentPrefixNeighbors = upperSubnetNeighbors(
            mainSubnetAddress,
            mask,
            intrestOctInd,
            i
        );
        prefixedNeighbors.push(currentPrefixNeighbors);
    }

    return prefixedNeighbors;
}

/**
 * @param {*} e click event
 */
function vlsmAddRemoveCallback(e) {
    e.preventDefault();

    if (e.target.classList.contains("js-add-subnet")) {
        vlsmInputs.appendChild(vlsmTemplateInput.cloneNode(true));
    } else if (e.target.classList.contains("js-remove-subnet")) {
        e.target.parentElement.remove();
    }
}

/**
 * @param {string} cidrAddr
 * @requires cidrToSubnetAndPrefix
 * @requires ipv4RangeValidity throws error
 * @requires getIntrestOctIndFromPreix
 * @requires prefix2mask
 * @requires blockSizeFromPrefix
 */
function mainSubnetData(cidrAddr) {
    const mainSubnet = cidrToSubnetAndPrefix(cidrAddr);
    mainSubnet.intrestOctInd = getIntrestOctIndFromPreix(mainSubnet.prefix);
    mainSubnet.mask = prefix2mask(mainSubnet.prefix, mainSubnet.intrestOctInd);
    mainSubnet.size = blockSizeFromPrefix(mainSubnet.prefix);

    return mainSubnet;
}

/**
 * Gets full data for all the chunks / Does **SORTING**
 * @param {string[]} startAddr main Subnet Address
 */
function vlsmChunksData(startAddr) {
    const subnetSizes = document.querySelectorAll(".js-vlsm-subnets");
    const subnetNames = document.querySelectorAll(".js-vlsm-names");

    const vlsmChuncks = [];
    for (let i = 0; i < subnetSizes.length; i++) {
        vlsmChuncks.push({
            subnetName: subnetNames[i].value,
            subnetHosts: parseInt(subnetSizes[i].value),
            subnetOccupation: parseInt(subnetSizes[i].value) + 2,
        });
    }

    // maybe give the user a sorting choice
    vlsmChuncks.sort((a, b) => {
        if (parseInt(a.subnetHosts) > parseInt(b.subnetHosts)) {
            return -1;
        } else if (parseInt(a.subnetHosts) < parseInt(b.subnetHosts)) {
            return +1;
        } else {
            return 0;
        }
    });

    vlsmChuncks.forEach((net) => {
        net.prefix = prefixFromSize(net.subnetOccupation);
        net.intrestOctInd = getIntrestOctIndFromPreix(net.prefix);
        net.mask = prefix2mask(net.prefix, net.intrestOctInd);
        net.blockSize = blockSizeFromPrefix(net.prefix);
        net.freeSpace = net.blockSize - net.subnetOccupation;
    });

    // startAddr looses its meanning in first itaration here
    vlsmChuncks.forEach((net) => {
        net.subnetIp = [...startAddr];
        nextSubnetAddr(startAddr, net.blockSize);
    });

    vlsmChuncks.forEach((net) => {
        [
            undefined,
            net.firstHost,
            net.lastHost,
            net.broadcastIp,
        ] = subnetMapping(net.subnetIp, net.mask, net.intrestOctInd);
    });

    return vlsmChuncks;
}

/**
 * **STEPS**
 * - get current subnet address
 * - tranform current subnet address from DEC2BIN
 * - - add padding 0s for each octet if it isn't 8 bits long
 * - format current subnet address from array to string
 * - add current block size to current subnet address : gets next next subnet address
 * - add padding 0 bits if it isn't 32 bits long
 * - format next subnet address from string to array
 * - tranform next subnet address from BIN2DEC
 * @param {string[]} subnetIp passed by reference
 * @param {number} blockSize
 */
function nextSubnetAddr(subnetIp, blockSize) {
    // write octets in binary
    subnetIp.forEach((octet, i) => {
        octet = dec2bin(octet);

        // left padding 0 bits
        if (octet.length < 8) {
            const breakOut = 8 - octet.length;
            for (let i = 0; i < breakOut; i++) {
                octet = "0" + octet;
            }
        }

        subnetIp[i] = octet;
    });

    // fuse the octets: 32 chars string
    const binSubnetAddr = subnetIp.join("");

    // addition (looses extra 0s that on the left)
    let nextSubentAddr = addBin(bin2dec(binSubnetAddr), blockSize);

    // left padding 0 bits
    if (nextSubentAddr.length < 32) {
        const breakOut = 32 - nextSubentAddr.length;
        for (let i = 0; i < breakOut; i++) {
            nextSubentAddr = "0" + nextSubentAddr;
        }
    }

    // spliting the binary string
    subnetIp[0] = nextSubentAddr.substr(-32, 8);
    subnetIp[1] = nextSubentAddr.substr(-24, 8);
    subnetIp[2] = nextSubentAddr.substr(-16, 8);
    subnetIp[3] = nextSubentAddr.substr(-8, 8);

    // transforming the binary octets to decimal
    subnetIp.forEach((octet, i) => {
        octet = bin2dec(octet);
        subnetIp[i] = octet;
    });

    // the end result is passed by reference
}
