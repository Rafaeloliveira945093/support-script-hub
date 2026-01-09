{ pkgs }: {
  deps = [
    pkgs.imagemagick_light
    pkgs.rpm
    pkgs.nodejs_20
    pkgs.nodePackages.npm
  ];
}
