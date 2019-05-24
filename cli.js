#!/usr/bin/env node
const fs = require("fs");
const spawn = require("child_process").spawn;

const [, , dir, type, debug] = process.argv;
if (dir === "--help") {
  return console.log(`
  1. If you want a TDD project with Typescript:
  yarn create jest-babel-tdd your-app-name --typescript

  2. If you want a TDD project with Babel (v7):
  yarn create jest-babel-tdd your-app-name --babel

  3. If you want a TDD project with Vanilla Nodejs:
  yarn create jest-babel-tdd your-app-name
  `);
}
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
} else {
  return console.log("Err: dir name is exist. Please choose another dir name");
}
const funcExp = `function sum(a, b) {
  return a + b;
}
module.exports = sum;`;
const testExp = `const sum = require('./sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});`;
let child;

if (type === "--typescript") {
  child = spawn(
    `cd ${dir} && mkdir src && git init && yarn init -y && yarn add --dev @types/jest @types/node jest ts-jest typescript && touch .gitignore && echo node_modules >> .gitignore`,
    {
      shell: true
    }
  );
} else if (type === "--babel") {
  child = spawn(
    `cd ${dir} && mkdir src && git init && yarn init -y && yarn add --dev jest babel-jest @babel/core @babel/preset-env && touch .gitignore && echo node_modules >> .gitignore`,
    {
      shell: true
    }
  );
} else {
  child = spawn(
    `cd ${dir} && mkdir src && git init && yarn init -y && yarn add --dev jest && touch .gitignore && echo node_modules >> .gitignore`,
    {
      shell: true
    }
  );
}
child.stderr.on("data", function(data) {
  if (debug) console.log("something went wrong!", data.toString());
});
child.stdout.on("data", function(data) {
  if (debug) console.log("STDOUT:", data.toString());
  if (type === '--typescript') {
    const jestConfig = `
      module.exports = {
        roots: ['<rootDir>/src'],
        transform: {
          '^.+\\.tsx?$': 'ts-jest',
        },
        testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
        moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      }
    `;
    const tsConfig = `
    {
      "compilerOptions": {
        "target": "es5",
        "module": "commonjs",
        "lib": ["es2015"],
        "strict": true,
        "declaration": true,
        "outDir": "dist",
        "sourceMap": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "**/*.spec.ts"]
    }
    `;
    const mainFile = `
    export const sum = (a: number, b: number) => a + b;
    `;
    const mainSpecFile = `
    import { sum } from './main';

    test('should return false given external link', () => {
      expect(sum(1, 2)).toBe(3);
    })

    test('should return true given internal link', () => {
      expect(sum(1, 2)).toBe(3);
    })
    `;
    fs.writeFileSync(`./${dir}/jest.config.js`, jestConfig);
    fs.writeFileSync(`./${dir}/tsconfig.json`, tsConfig);
    fs.writeFileSync(`./${dir}/src/main.ts`, mainFile);
    fs.writeFileSync(`./${dir}/src/main.spec.ts`, mainSpecFile);
  } else if (type === "--babel") {
    const mainFile = `
    export const sum = (a, b) => a + b;
    `;
    const mainTestFile = `
    import { sum } from './main';

    test('should return false given external link', () => {
      expect(sum(1, 2)).toBe(3);
    })

    test('should return true given internal link', () => {
      expect(sum(1, 2)).toBe(3);
    })
    `;
    const babelConfig = `
    // babel.config.js
    module.exports = {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    };`;
    fs.writeFileSync(`./${dir}/babel.config.js`, babelConfig);
    fs.writeFileSync(`./${dir}/src/main.js`, mainFile);
    fs.writeFileSync(`./${dir}/src/main.test.js`, mainTestFile);
  } else {
    fs.writeFileSync(`./${dir}/sum.js`, funcExp);
    fs.writeFileSync(`./${dir}/sum.test.js`, testExp);
  }
});
child.on("exit", function(exitCode) {
  if (debug) console.log("Child exited with code: " + exitCode);
  console.log('Done!')
});
