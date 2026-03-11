{ config, lib, pkgs, ... }:

let
  cfg = config.lumina.signer;

  applyRelease = pkgs.writeShellScriptBin "lumina-signer-apply-release" ''
    set -euo pipefail

    if [ "$#" -ne 3 ]; then
      echo "usage: lumina-signer-apply-release <image-ref> <git-sha> <released-at>" >&2
      exit 64
    fi

    image_ref="$1"
    git_sha="$2"
    released_at="$3"
    state_dir=${lib.escapeShellArg cfg.stateDir}
    target_file="$state_dir/release.env"

    case "$image_ref" in
      ${cfg.imageRepository}@sha256:*) ;;
      *)
        echo "IMAGE_REF must be an immutable ${cfg.imageRepository} digest" >&2
        exit 65
        ;;
    esac

    tmp_file="$(mktemp "$state_dir/release.env.XXXXXX")"
    trap 'rm -f "$tmp_file"' EXIT

    cat >"$tmp_file" <<EOF
IMAGE_REF=$image_ref
GIT_SHA=$git_sha
RELEASED_AT=$released_at
EOF

    chmod 0600 "$tmp_file"
    chown root:root "$tmp_file"
    mv "$tmp_file" "$target_file"
  '';
in
{
  options.lumina.signer = {
    enable = lib.mkEnableOption "Lumina signer service";

    appName = lib.mkOption {
      type = lib.types.str;
      default = "lumina-signer";
      description = "Container and service name.";
    };

    publicHostname = lib.mkOption {
      type = lib.types.str;
      description = "Public hostname exposed through Caddy.";
    };

    targetEnvironment = lib.mkOption {
      type = lib.types.enum [
        "zeko-testnet"
        "mina-mainnet"
        "zeko-mainnet"
      ];
      description = "Signer environment label.";
    };

    stateDir = lib.mkOption {
      type = lib.types.str;
      default = "/var/lib/lumina-signer";
      description = "Host directory holding runtime env and release metadata.";
    };

    imageRepository = lib.mkOption {
      type = lib.types.str;
      default = "ghcr.io/lumina-dex/lumina-signer";
      description = "Immutable image repository used for releases.";
    };

    listenAddress = lib.mkOption {
      type = lib.types.str;
      default = "127.0.0.1";
      description = "Local bind address used by the container port mapping.";
    };

    listenPort = lib.mkOption {
      type = lib.types.port;
      default = 3001;
      description = "Container port exposed locally for Caddy.";
    };
  };

  config = lib.mkIf cfg.enable {
    assertions = [
      {
        assertion = cfg.appName == "lumina-signer";
        message = "New signer hosts are standardized on the lumina-signer app name.";
      }
    ];

    virtualisation.podman.enable = true;

    systemd.tmpfiles.rules = [
      "d ${cfg.stateDir} 0750 root root -"
    ];

    environment.systemPackages = [
      applyRelease
      pkgs.curl
      pkgs.jq
      pkgs.podman
    ];

    security.sudo.extraRules = [
      {
        users = [ config.lumina.baseHardening.serviceUser ];
        commands = [
          {
            command = "${applyRelease}/bin/lumina-signer-apply-release";
            options = [ "NOPASSWD" ];
          }
          {
            command = "${pkgs.systemd}/bin/systemctl restart ${cfg.appName}";
            options = [ "NOPASSWD" ];
          }
          {
            command = "${pkgs.systemd}/bin/systemctl start ${cfg.appName}";
            options = [ "NOPASSWD" ];
          }
        ];
      }
    ];

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
        pkgs.gnugrep
        pkgs.podman
      ];
      serviceConfig = {
        Type = "simple";
        Restart = "always";
        RestartSec = "5s";
        TimeoutStartSec = "300";
        TimeoutStopSec = "30";
        ExecCondition = "${pkgs.bash}/bin/bash -euo pipefail -c 'test -s ${cfg.stateDir}/env && test -s ${cfg.stateDir}/release.env'";
        ExecStartPre = [
          "${pkgs.bash}/bin/bash -euo pipefail -c '. ${cfg.stateDir}/release.env; test -n \"$IMAGE_REF\"; ${pkgs.podman}/bin/podman pull \"$IMAGE_REF\"'"
          "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}"
        ];
        ExecStart = "${pkgs.bash}/bin/bash -euo pipefail -c '. ${cfg.stateDir}/release.env; exec ${pkgs.podman}/bin/podman run --rm --replace --name ${cfg.appName} --env GIT_REV=\"$GIT_SHA\" --env-file ${cfg.stateDir}/env -p ${cfg.listenAddress}:${toString cfg.listenPort}:3001 \"$IMAGE_REF\"'";
        ExecStop = "-${pkgs.podman}/bin/podman stop -t 15 ${cfg.appName}";
        ExecStopPost = "-${pkgs.podman}/bin/podman rm -f ${cfg.appName}";
      };
    };
  };
}
