import { userData } from "package.json";
import { input, select } from "@inquirer/prompts";
import { access, readdir } from "fs/promises";
import { join } from "path";
import { copy } from "../utils/FS";
import { normalPath } from "../utils/obtain/Dir";

process.on(
    "uncaughtException",
    (event: unknown) => (console.log(event), process.exit(1)),
);

const {
        app: { web },
    } = userData,
    targetDir: string = normalPath(web);
let name: string = "";

do {
    const resultName: string = await input({
        message: "项目名：",
        required: true,
        validate: (value: string) => {
            if (!value.trim()) {
                return "项目名称不能为空";
            }

            if (/[<>:"/\\|?*]/.test(value)) {
                return "项目名不能包含非法字符";
            }

            return true;
        },
    });

    try {
        await access(join(targetDir, resultName));

        console.log("项目已存在");
    } catch {
        name = resultName;
    }
} while (!name);

const project: string = await select({
    message: "项目类型：",
    choices: [
        {
            name: "React",
            value: "HelloReact",
        },
        {
            name: "Vue",
            value: "HelloVue",
        },
        {
            name: "Angular",
            value: "HelloAngular",
        },
    ],
});

const source: string = normalPath(`preset/${project}`),
    paths: string[] = await readdir(source),
    target: string = normalPath(join(web, name));

for await (const path of paths) {
    copy(join(source, path), target);
}

console.log(`已创建项目：${name}`);
