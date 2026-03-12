{
  description = "Lumina signer NixOS hosts";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { self, nixpkgs, ... }:
    let
      inherit (nixpkgs) lib;
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      hostDefinitions = import ./lib/host-definitions.nix;
      mkHost = host:
        nixpkgs.lib.nixosSystem {
          inherit (host) system;
          modules = [ host.module ];
        };
    in
    {
      nixosModules = {
        lumina-host = import ./modules/lumina-host.nix;
        lumina-base-hardening = import ./modules/lumina-base-hardening.nix;
        lumina-caddy = import ./modules/lumina-caddy.nix;
        lumina-signer = import ./modules/lumina-signer.nix;
      };

      nixosConfigurations = lib.mapAttrs (_: mkHost) hostDefinitions;

      formatter = nixpkgs.lib.genAttrs systems (system: nixpkgs.legacyPackages.${system}.nixfmt-rfc-style);
    };
}
