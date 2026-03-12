{
  description = "Lumina signer NixOS hosts";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { self, nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      mkHost = system: module:
        nixpkgs.lib.nixosSystem {
          inherit system;
          modules = [ module ];
        };
    in
    {
      nixosModules = {
        lumina-base-hardening = import ./modules/lumina-base-hardening.nix;
        lumina-caddy = import ./modules/lumina-caddy.nix;
        lumina-signer = import ./modules/lumina-signer.nix;
      };

      nixosConfigurations = {
        zeko-testnet-signer = mkHost "x86_64-linux" ./hosts/zeko-testnet-signer.nix;
        mina-mainnet-signer = mkHost "x86_64-linux" ./hosts/mina-mainnet-signer.nix;
        zeko-mainnet-signer = mkHost "x86_64-linux" ./hosts/zeko-mainnet-signer.nix;
        local-arm64-signer-test = mkHost "aarch64-linux" ./hosts/local-arm64-signer-test.nix;
      };

      formatter = nixpkgs.lib.genAttrs systems (system: nixpkgs.legacyPackages.${system}.nixfmt-rfc-style);
    };
}
