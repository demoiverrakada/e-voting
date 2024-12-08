import subprocess
import os

project_dir = "/app/e-voting/src/evoting_localstorage/evoting_fron/android"

os.chdir(project_dir)

def run_gradle_commands():
    try:
        # Run the `./gradlew clean` command
        print("Running './gradlew clean'...")
        result_clean = subprocess.run(["./gradlew", "clean"], capture_output=True, text=True)
        if result_clean.returncode != 0:
            print("Error during 'clean' process:")
            print(result_clean.stderr)
            return
        print(result_clean.stdout)

        # Run the `./gradlew assembleRelease` command
        print("Running './gradlew assembleRelease'...")
        result_assemble = subprocess.run(["./gradlew", "assembleRelease"], capture_output=True, text=True)
        if result_assemble.returncode != 0:
            print("Error during 'assembleRelease' process:")
            print(result_assemble.stderr)
            return
        print(result_assemble.stdout)

        print("Build process completed successfully!")

    except FileNotFoundError as e:
        print(f"Error: {e}. Ensure 'gradlew' is present and executable in the directory.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    run_gradle_commands()
