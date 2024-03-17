const { defaults } = require('jest-config');

module.exports = {
    ...defaults,
    verbose: true,
    transform: {
        "\\.tsx?$": "ts-jest",
        "\\.ts?$": "ts-jest",
        "\\.[jt]sx?$": "babel-jest"
    },
    moduleNameMapper: {
        "src/(.*)": "<rootDir>/src/$1",
        ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "identity-obj-proxy"
    },
    globals: {
        "IS_REACT_ACT_ENVIRONMENT": true
    },
    collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
    ],
    coveragePathIgnorePatterns: [
        "/src/App.js",
        "/src/index.js",
        "/src/reportWebVitals.js",
        "/src/reportWebVitals.js",
        "/src/api"
    ],
    testPathIgnorePatterns: ["./node_modules/"],
    testMatch: ["<rootDir>/src/__tests__/**/*.test.js"],
    moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],
    collectCoverage: true,
    clearMocks: true,
    coverageDirectory: "coverage",
    testEnvironment: "jest-environment-jsdom",
    setupFilesAfterEnv: ["allure-jest"],
};