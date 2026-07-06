require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

# Adds an SPM package's source directly to the project at install time.
# This ensures we can use an SPM package in our library in the absence of a working
# `spm_dependency` implementation (see expo/expo#37813).
def self.add_spm_package_source(s, repo:, tag:, source_path:, dest_path:)
  name = repo.split("/").last
  s.prepare_command = <<-CMD
    rm -rf #{dest_path}
    mkdir -p #{File.dirname(dest_path)}
    curl -sL "https://github.com/#{repo}/archive/refs/tags/#{tag}.tar.gz" -o /tmp/#{name}.tar.gz
    tar -xzf /tmp/#{name}.tar.gz -C /tmp
    mv "/tmp/#{name}-#{tag}/#{source_path}" #{dest_path}
    rm -rf /tmp/#{name}.tar.gz "/tmp/#{name}-#{tag}"
  CMD
end

Pod::Spec.new do |s|
  s.name            = "native-evervault"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = package["description"]
  s.homepage        = package["homepage"]
  s.license         = package["license"]
  s.platforms       = { :ios => "11.0" }
  s.author          = package["author"]
  s.source          = { :git => package["repository"]["url"], :tag => "#{s.version}" }

  s.source_files    = "ios/**/*.{h,m,mm,swift}"

  # Add the EvervaultCore package directly to the project.
  # We can use the code directly without `import` statements.
  add_spm_package_source(s, 
    repo: "evervault/evervault-ios",
    tag: "2.1.0",
    source_path: "Sources/EvervaultCore",
    dest_path: "ios/vendor/EvervaultCore"
  )

  install_modules_dependencies(s)
end