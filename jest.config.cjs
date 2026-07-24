/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2023",
          module: "CommonJS",
          moduleResolution: "node10",
          esModuleInterop: true,
          isolatedModules: true,
          skipLibCheck: true,
          strict: true,
          ignoreDeprecations: "6.0",
          paths: { "@/*": ["./src/react-app/*"] },
          baseUrl: ".",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/react-app/$1",
  },
};
