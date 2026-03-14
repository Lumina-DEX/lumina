{ config, lib, pkgs, ... }:

let
  cfg = config.lumina.signer;
  podmanArgs = lib.concatStringsSep " " (map lib.escapeShellArg cfg.extraPodmanArgs);
  envFileArg =
    if cfg.envFile == null then
      ""
    else
      "--env-file ${lib.escapeShellArg cfg.envFile}";
  pullScript = pkgs.writeShellScript "lumina-signer-pull" ''
    set -euo pipefail
    . ${lib.escapeShellArg cfg.releaseEnvFile}
    exec ${pkgs.podman}/bin/podman pull "$IMAGE_REF"
  '';
  runScript = pkgs.writeShellScript "lumina-signer-run" ''
    set -euo pipefail
    . ${lib.escapeShellArg cfg.releaseEnvFile}
    exec ${pkgs.podman}/bin/podman run \
      --rm \
      --replace \
      --name ${lib.escapeShellArg cfg.appName} \
      -p ${lib.escapeShellArg "${cfg.listenAddress}:${toString cfg.listenPort}:${toString cfg.containerPort}"} \
      ${envFileArg} \
      ${podmanArgs} \
      "$IMAGE_REF"
  '';
  preflightScript = pkgs.writeShellScript "lumina-signer-preflight" ''
    set -euo pipefail
    test -s ${lib.escapeShellArg cfg.releaseEnvFile}
    ${lib.optionalString (cfg.envFile != null) ''
      test -s ${lib.escapeShellArg cfg.envFile}
    ''}
  '';
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
      default = 3001;
      description = "Port exposed by the container image.";
    };

    envFile = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      default = "/var/lib/lumina-signer/env";
      description = "Optional env file passed to podman.";
    };

    releaseEnvFile = lib.mkOption {
      type = lib.types.str;
      default = "/var/lib/lumina-signer/release.env";
      description = "Release metadata file consumed by the systemd service.";
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
      description = "Lumina signer container";
      after = [
        "network-online.target"
        "podman.service"
      ];
      wants = [ "network-online.target" ];
      wantedBy = [ "multi-user.target" ];
      path = [
        pkgs.bash
        pkgs.coreutils
        pkgs.podman
      ];
      serviceConfig = {
        Type = "simple";
        Restart = "always";
        RestartSec = "5s";
        TimeoutStartSec = "600";
        TimeoutStopSec = "30";
        ExecCondition = preflightScript;
        ExecStartPre = [
          pullScript
          "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}"
        ];
        ExecStart = runScript;
        ExecStop = "-${pkgs.podman}/bin/podman stop -t 20 ${cfg.appName}";
        ExecStopPost = "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}";
      };
    };
  };
}
