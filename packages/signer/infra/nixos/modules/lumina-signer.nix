{ config, lib, pkgs, ... }:

let
  imageFromEnv = builtins.getEnv "LUMINA_SIGNER_IMAGE_REF";
  containerPortFromEnv = builtins.getEnv "LUMINA_SIGNER_CONTAINER_PORT";
  envFileFromEnv = builtins.getEnv "LUMINA_SIGNER_ENV_FILE";
  cfg = config.lumina.signer;
  envArgs =
    if cfg.envFile == null then
      [ ]
    else
      [
        "--env-file"
        cfg.envFile
      ];
  podmanCommand = [
    "${pkgs.podman}/bin/podman"
    "run"
    "--rm"
    "--replace"
    "--name"
    cfg.appName
    "-p"
    "${cfg.listenAddress}:${toString cfg.listenPort}:${toString cfg.containerPort}"
  ] ++ envArgs ++ cfg.extraPodmanArgs ++ [
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
        if imageFromEnv != "" then imageFromEnv else throw "Set LUMINA_SIGNER_IMAGE_REF before rebuilding the host.";
      description = ''
        Container image to run. CI and the initial bootstrap both inject the signer image digest
        through LUMINA_SIGNER_IMAGE_REF.
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
      default =
        if containerPortFromEnv != "" then
          builtins.fromJSON containerPortFromEnv
        else
          3001;
      description = "Port exposed by the container image.";
    };

    envFile = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      default = if envFileFromEnv != "" then envFileFromEnv else "/var/lib/lumina-signer/env";
      description = "Optional env file passed to podman.";
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
        pkgs.coreutils
        pkgs.podman
      ];
      serviceConfig = {
        Type = "simple";
        Restart = "always";
        RestartSec = "5s";
        TimeoutStartSec = "300";
        ExecStartPre = [
          (lib.escapeShellArgs [
            "${pkgs.podman}/bin/podman"
            "pull"
            cfg.imageRef
          ])
          "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}"
        ];
        ExecStart = lib.escapeShellArgs podmanCommand;
        ExecStop = "-${pkgs.podman}/bin/podman stop -t 15 ${cfg.appName}";
        ExecStopPost = "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}";
      } // lib.optionalAttrs (cfg.envFile != null) {
        # Use an explicit argv so the env-file path is quoted correctly even if
        # it ever contains whitespace.
        ExecCondition = lib.escapeShellArgs [
          "${pkgs.coreutils}/bin/test"
          "-s"
          cfg.envFile
        ];
      };
    };
  };
}
