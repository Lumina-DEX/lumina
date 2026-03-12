{ lib, ... }:

let
  mkSignerHost = import ../lib/mk-signer-host.nix { inherit lib; };
in
mkSignerHost {
  host = {
    hostName = "lumina-signer-local-arm64-test";
    publicHostname = "localhost";
    targetEnvironment = "zeko-testnet";
  };
  extraImports = [
    ../modules/lumina-orbstack-local-vm.nix
  ];
  extraConfig = {
    # Match the live OrbStack guest defaults where they are machine-specific,
    # while still exercising the real signer modules.
    lumina.baseHardening.stateVersion = "26.05";
    lumina.baseHardening.timezone = "Asia/Bangkok";
    # The local verification host uses a dummy nginx image, so its container
    # port must stay aligned with nginx's default listener.
    lumina.signer.containerPort = 80;
  };
}
