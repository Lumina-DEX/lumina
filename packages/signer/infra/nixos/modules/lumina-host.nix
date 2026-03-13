{ lib, ... }:

{
  options.lumina.host = {
    hostName = lib.mkOption {
      type = lib.types.str;
      description = "Internal NixOS hostname for the signer host.";
    };

    publicHostname = lib.mkOption {
      type = lib.types.str;
      description = "Public hostname served for the signer host.";
    };

    targetEnvironment = lib.mkOption {
      type = lib.types.enum [
        "zeko-testnet"
        "mina-mainnet"
        "zeko-mainnet"
      ];
      description = "Static deployment environment label for the signer host.";
    };
  };
}
