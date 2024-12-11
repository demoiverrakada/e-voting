import subprocess
import os

def run_gradle_commands():
    project_dir = "/app/evoting_localstorage/BallotAudit/android"
    gradle_path = os.path.join(project_dir, "gradlew")
    
    # Copy the current environment variables
    env = os.environ.copy()

    # Add the paths for Android SDK, Java, Node.js, and other necessary binaries
    env["ANDROID_HOME"] = "/root/android-sdk"
    env["PATH"] = "/root/android-sdk/platform-tools:/root/android-sdk/cmdline-tools/latest/bin:/usr/lib/jvm/java-17-openjdk-amd64/bin:/root/.nvm/versions/node/v22.3.0/bin:/opt/venv/bin:/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" + ":" + env["PATH"]

    try:
        # Change to the project directory
        os.chdir(project_dir)
        print("Current working directory:", os.getcwd())

        # Run 'sed' to remove carriage returns in 'gradlew' (for compatibility)
        print("Removing carriage returns from 'gradlew'...")
        subprocess.run(["sed", "-i", "s/\r$//", "gradlew"], check=True)

        # Ensure 'gradlew' is executable
        subprocess.run(["chmod", "+x", gradle_path], check=True)

        # Run `./gradlew clean`
        print("Running './gradlew clean'...")
        result_clean = subprocess.run(
            ["./gradlew", "clean"],
            capture_output=True,
            text=True,
            env=env,
            shell=False
        )
        if result_clean.returncode != 0:
            print("Error during 'clean' process:")
            print(result_clean.stderr)
            return False
        print(result_clean.stdout)

        # Run `./gradlew assembleRelease`
        print("Running './gradlew assembleRelease'...")
        result_assemble = subprocess.run(
            ["./gradlew", "assembleRelease"],
            capture_output=True,
            text=True,
            env=env,
            shell=False
        )
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
    run_gradle_commands()
