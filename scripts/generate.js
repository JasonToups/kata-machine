const fs = require("fs");
const path = require("path");
const config = require("../ligma.config");
const dsa = require("./dsa");

// Parse command line arguments
const args = process.argv.slice(2);
const includeComments = args.includes("--comments") || args.includes("-c");

const src_path = path.join(__dirname, "..", "src");
let day = 1;

try {
    day =
        +fs
            .readdirSync(src_path)
            .filter((i) => i.includes("day"))
            .sort((a, b) => {
                return +b.substring(3) - a.substring(3);
            })[0]
            .substring(3) + 1;

    if (isNaN(day)) {
        console.log("day is nan");
        day = 1;
    }
} catch (e) {
    day = 1;
}

const day_name = `day${day}`;
const day_path = path.join(src_path, day_name);
const relative_day_path = path.relative(process.cwd(), day_path);
try {
    fs.unlinkSync(day_path);
} catch (e) {}
try {
    fs.mkdirSync(day_path);
} catch (e) {}

function generate_method(method) {
    const comment =
        includeComments && method.comment ? `    // ${method.comment}` : "";
    return `${method.name}(${method.args || ""}): ${method.return || "void"} {
${comment}
}`;
}

function generate_property(prop) {
    const comment =
        includeComments && prop.fieldComment
            ? `    // ${prop.fieldComment}`
            : "";
    return `${comment}
    ${prop.scope} ${prop.name}: ${prop.type};`;
}

function generate_getter(getter) {
    const comment =
        includeComments && getter.comment ? `    // ${getter.comment}` : "";
    return `${comment}
    get ${getter.name}(): ${getter.return} {
    return this.${getter.prop_name};
}`;
}

function create_class(name, item) {
    const classComment =
        includeComments && item.comment
            ? `/**
 * ${item.comment}
 */
`
            : "";

    const classImplementationComment =
        includeComments && item.classComment
            ? `    // ${item.classComment}`
            : "";

    const constructorComment =
        includeComments && item.constructorComment
            ? `        // ${item.constructorComment}`
            : "";

    fs.writeFileSync(
        path.join(day_path, `${name}.ts`),
        `${classComment}export default class ${name}${item.generic || ""} {
    ${(item.properties || []).map(generate_property).join("\n    ")}
${classImplementationComment}

    ${(item.getters || []).map(generate_getter).join("\n    ")}

    constructor() {
${constructorComment}
    }

    ${(item.methods || []).map(generate_method).join("\n    ")}
}`,
    );
}

function create_function(name, item) {
    const g = item.generic ? item.generic : "";
    const functionComment =
        includeComments && item.comment
            ? `/**
 * ${item.comment}
 */
`
            : "";

    fs.writeFileSync(
        path.join(day_path, `${name}.ts`),
        `${functionComment}export default function ${item.fn}${g}(${
            item.args
        }): ${item.return} {
    ${includeComments ? "// TODO: Implement function logic" : ""}
}`,
    );
}

config.dsa.forEach((ds) => {
    const item = dsa[ds];
    if (!item) {
        throw new Error(`algorithm ${ds} could not be found`);
    }
    if (item.type === "class") {
        create_class(ds, item);
    } else {
        create_function(ds, item);
    }
});

const align = require("./align-configs");
align.jest(day_name);
align.ts_config(day_name);
align.package_json(config, relative_day_path);
align.stats(config, day_path);
