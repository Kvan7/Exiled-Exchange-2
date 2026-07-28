#!/usr/bin/env python3

import json
import re


def extract_version_from_readme():
    with open("README.md", "r") as file:
        content = file.read()
    match = re.search(r"Exiled-Exchange-2-Setup-(\d+\.\d+\.\d+)", content)
    if match:
        return match.group(1)
    return None


def extract_version_from_bug_report():
    with open(".github/ISSUE_TEMPLATE/bug-report.yml", "r") as file:
        for line in file:
            match = re.match(r"^\s*-\s*(\d+\.\d+\.\d+)", line)
            if match:
                return match.group(1)
    return None


def extract_version_from_config():
    with open("docs/.vitepress/config.js", "r") as file:
        content = file.read()
    match = re.search(r"appVersion: \'(\d+\.\d+\.\d+)\'", content)
    if match:
        return match.group(1)
    return None


def extract_version_from_package_json():
    with open("main/package.json", "r") as file:
        package_data: dict[str, str] = json.load(file)  # pyright: ignore[reportAny]
    return package_data["version"]


def extract_version_from_package_lock():
    with open("main/package-lock.json", "r") as file:
        package_lock_data: dict[str, dict[str, dict[str, str]]] = json.load(file)  # pyright: ignore[reportAny]
    top_version = package_lock_data["version"]
    packages_version = package_lock_data["packages"][""]["version"]
    return top_version, packages_version


def main():
    readme_version = extract_version_from_readme()
    bug_report_version = extract_version_from_bug_report()
    config_version = extract_version_from_config()
    package_json_version = extract_version_from_package_json()
    package_lock_top_version, package_lock_packages_version = (
        extract_version_from_package_lock()
    )

    if (
        readme_version != bug_report_version
        or readme_version != config_version
        or readme_version != package_json_version
        or readme_version != package_lock_top_version
        or readme_version != package_lock_packages_version
    ):
        print("Version mismatch detected:")
        print(f"  README.md version: {readme_version}")
        print(f"  Bug report version: {bug_report_version}")
        print(f"  Config.js version: {config_version}")
        print(f"  package.json version: {package_json_version}")
        print(f"  package-lock.json top-level version: {package_lock_top_version}")
        print(
            f"  package-lock.json packages[] version: {package_lock_packages_version}"
        )
        exit(1)

    print("Version check passed. All versions are consistent.")


if __name__ == "__main__":
    main()
