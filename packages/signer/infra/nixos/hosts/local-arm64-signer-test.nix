{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
in
mkSignerHost {
  hostName = "lumina-signer-local-arm64-test";
  publicHostname = "localhost";
  targetEnvironment = "zeko-testnet";
  extraImports = [
    ../modules/lumina-orbstack-local-vm.nix
  ];
  extraConfig = {
    # Match the live OrbStack guest defaults where they are machine-specific,
    # while still exercising the real signer modules.
    lumina.baseHardening.stateVersion = "26.05";
    lumina.baseHardening.timezone = "Asia/Bangkok";
  };
}
