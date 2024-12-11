import subprocess
import os

def run_gradle_commands():
    project_dir = "/app/evoting_localstorage/evoting_fron/android"
    os.chdir(project_dir)

    try:
        # Run the `./gradlew clean` command
        print("Running './gradlew clean'...")
        result_clean = subprocess.run(["./gradlew", "clean"], capture_output=True, text=True)
        if result_clean.returncode != 0:
            print("Error during 'clean' process:")
            print(result_clean.stderr)
            return False
        print(result_clean.stdout)

        # Run the `./gradlew assembleRelease` command
        print("Running './gradlew assembleRelease'...")
        result_assemble = subprocess.run(["./gradlew", "assembleRelease"], capture_output=True, text=True)
        if result_assemble.returncode != 0:
            print("Error during 'assembleRelease' process:")
            print(result_assemble.stderr)
            return False
        print(result_assemble.stdout)

        print("Build process completed successfully!")
        return True

    except FileNotFoundError as e:
        print(f"Error: {e}. Ensure 'gradlew' is present and executable in the directory.")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False

if __name__ == "__main__":
    if not run_gradle_commands():
        print("Gradle commands failed. Attempting to fix potential line-ending issues with 'gradlew'...")
        try:
            # Fix line-ending issues in gradlew
            subprocess.run(["sed", "-i", "s/\r$//", "./gradlew"], check=True)
            print("Line-ending issues fixed. Retrying Gradle commands...")

            # Retry gradle commands
            if not run_gradle_commands():
                print("Gradle commands failed again after fixing line-ending issues. Exiting.")
                exit(1)

        except Exception as e:
            print(f"An unexpected error occurred while fixing line-ending issues: {e}")
            exit(1)
