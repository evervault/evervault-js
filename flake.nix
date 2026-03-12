{
  description = "JS Monorepo";

  # Flake inputs
  inputs = {
    # Latest stable Nixpkgs
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0";
  };

  # Flake outputs
  outputs = { self, nixpkgs }:
    let
      # Systems supported
      allSystems = [
        "x86_64-linux" # 64-bit Intel/AMD Linux
        "aarch64-linux" # 64-bit ARM Linux
        "x86_64-darwin" # 64-bit Intel macOS
        "aarch64-darwin" # 64-bit ARM macOS
      ];

      # Helper to provide system-specific attributes
      forAllSystems = f: nixpkgs.lib.genAttrs allSystems (system: f {
        pkgs = import nixpkgs { inherit system; };
      });
    in
    {
      # Development environment output
      devShells = forAllSystems ({ pkgs }: {
        default = pkgs.mkShell {
          # The Nix packages provided in the environment
          packages = with pkgs; [
            openjdk17
            nodejs_24 # Match CI and avoid unsupported engine warnings
            corepack_22 # Required for pnpm
            cocoapods
          ];
          
          shellHook = ''
            echo "[INFO] Using Node: $(node -v)"
            export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
            # Use Xcode's toolchain
            export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
            export PATH="$DEVELOPER_DIR/Toolchains/XcodeDefault.xctoolchain/usr/bin:$PATH"
            export PATH="$DEVELOPER_DIR/usr/bin:$PATH"

            if [[ "$system" == *darwin* ]]; then
              export ANDROID_HOME="$HOME/Library/Android/sdk"
              export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
              echo "[INFO] ANDROID_HOME set to $ANDROID_HOME"

              export SDKROOT="$(xcrun --sdk iphoneos --show-sdk-path || true)"
              echo "[INFO] Xcode SDK root: $SDKROOT"
              echo "[INFO] clang path: $(which clang)"
            fi

            # Set the path to the local browsers for Playwright
            export PLAYWRIGHT_BROWSERS_PATH=$(pwd)/browsers
          '';
          };
      });
    };
}
