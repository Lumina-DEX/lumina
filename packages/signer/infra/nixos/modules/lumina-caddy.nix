{ config, lib, ... }:

let
  signerCfg = config.lumina.signer;
in
{
  config = lib.mkIf signerCfg.enable {
    services.caddy = {
      enable = true;
      virtualHosts.${signerCfg.publicHostname}.extraConfig = ''
        encode gzip zstd
        reverse_proxy ${signerCfg.listenAddress}:${toString signerCfg.listenPort}
      '';
    };
  };
}
