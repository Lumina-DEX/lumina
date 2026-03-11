{ config, lib, pkgs, ... }:

let
  imageFromEnv = builtins.getEnv "LUMINA_SIGNER_IMAGE_REF";
  cfg = config.lumina.signer;
  podmanCommand = [
    "${pkgs.podman}/bin/podman"
    "run"
    "--rm"
    "--replace"
    "--name"
    cfg.appName
    "-p"
    "${cfg.listenAddress}:${toString cfg.listenPort}:${toString cfg.containerPort}"
  ] ++ cfg.extraPodmanArgs ++ [
    cfg.imageRef
  ];
in
{
  options.lumina.signer = {
    enable = lib.mkEnableOption "Lumina signer service";

    appName = lib.mkOption {
      type = lib.types.str;
      default = "lumina-signer";
      description = "Container and systemd service name.";
    };

    publicHostname = lib.mkOption {
      type = lib.types.str;
      description = "Hostname served by Caddy.";
    };

    targetEnvironment = lib.mkOption {
      type = lib.types.enum [
        "zeko-testnet"
        "mina-mainnet"
        "zeko-mainnet"
      ];
      description = "Static environment label for the host.";
    };

    imageRef = lib.mkOption {
      type = lib.types.str;
      default =
        if imageFromEnv != "" then imageFromEnv else "docker.io/library/nginx:1.27-alpine";
      description = ''
        Container image to run. The default is intentionally a commodity webserver so the first
        rollout proves the host path without coupling it to the signer runtime yet.
      '';
    };

    listenAddress = lib.mkOption {
      type = lib.types.str;
      default = "127.0.0.1";
      description = "Bind address used behind Caddy.";
    };

    listenPort = lib.mkOption {
      type = lib.types.port;
      default = 3001;
      description = "Local port exposed to Caddy.";
    };

    containerPort = lib.mkOption {
      type = lib.types.port;
      default = 80;
      description = "Port exposed by the container image.";
    };

    extraPodmanArgs = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ ];
      description = "Extra podman arguments for the container run command.";
    };
  };

  config = lib.mkIf cfg.enable {
    virtualisation.podman.enable = true;

    systemd.services.${cfg.appName} = {
      description = "Lumina signer smoke container";
      after = [
        "network-online.target"
        "podman.service"
      ];
      wants = [ "network-online.target" ];
      wantedBy = [ "multi-user.target" ];
      path = [
        pkgs.coreutils
        pkgs.podman
      ];
      serviceConfig = {
        Type = "simple";
        Restart = "always";
        RestartSec = "5s";
        TimeoutStartSec = "300";
        ExecStartPre = [
          "${pkgs.podman}/bin/podman pull ${cfg.imageRef}"
          "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}"
        ];
        ExecStart = lib.escapeShellArgs podmanCommand;
        ExecStop = "-${pkgs.podman}/bin/podman stop -t 15 ${cfg.appName}";
        ExecStopPost = "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}";
      };
    };
  };
}
