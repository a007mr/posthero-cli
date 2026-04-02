'use strict';

const chalk = require('chalk');

const ZSH_COMPLETION = `
#compdef posthero
# PostHero CLI zsh completion
# Add to ~/.zshrc:  source <(posthero completion zsh)

_posthero() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C \\
    '--key[API key]:key:' \\
    '--json[Output raw JSON]' \\
    '--version[Show version]' \\
    '--help[Show help]' \\
    '1: :_posthero_commands' \\
    '*:: :->args'

  case $state in
    args)
      case $words[1] in
        accounts)  _posthero_accounts ;;
        posts)     _posthero_posts ;;
        media)     _posthero_media ;;
        analytics) _posthero_analytics ;;
      esac
  esac
}

_posthero_commands() {
  local commands=(
    'login:Save your API key locally'
    'logout:Remove stored API key'
    'whoami:Show current API key and account info'
    'accounts:Manage connected social media accounts'
    'posts:Create and manage posts'
    'media:Upload media files'
    'analytics:View post analytics and follower growth'
    'status:Show account and post overview'
    'completion:Output shell completion script'
  )
  _describe 'command' commands
}

_posthero_accounts() {
  local subcommands=('list:List all connected accounts')
  _describe 'subcommand' subcommands
}

_posthero_posts() {
  local subcommands=(
    'list:List posts'
    'get:Get a single post by ID'
    'create:Create a post'
    'update:Update a draft or scheduled post'
    'delete:Delete a post'
    'publish:Publish a draft immediately'
  )
  _describe 'subcommand' subcommands
}

_posthero_media() {
  local subcommands=('upload:Upload an image, video, or PDF')
  _describe 'subcommand' subcommands
}

_posthero_analytics() {
  local subcommands=(
    'summary:Aggregated KPIs for a platform'
    'posts:Paginated post analytics'
    'top:Top performers by metric'
    'follower-growth:Follower count and growth delta'
  )
  _describe 'subcommand' subcommands
}

compdef _posthero posthero
`;

const BASH_COMPLETION = `
# PostHero CLI bash completion
# Add to ~/.bashrc:  source <(posthero completion bash)

_posthero_completion() {
  local cur prev words cword
  _init_completion || return

  local commands="login logout whoami accounts posts media analytics status completion"
  local accounts_sub="list"
  local posts_sub="list get create update delete publish"
  local media_sub="upload"
  local analytics_sub="summary posts top follower-growth"
  local platforms="twitter threads instagram tiktok youtube"

  if [ "$cword" -eq 1 ]; then
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    return
  fi

  case "\${words[1]}" in
    accounts) COMPREPLY=($(compgen -W "$accounts_sub" -- "$cur")) ;;
    posts)    COMPREPLY=($(compgen -W "$posts_sub" -- "$cur")) ;;
    media)    COMPREPLY=($(compgen -W "$media_sub" -- "$cur")) ;;
    analytics)
      if [ "$cword" -eq 2 ]; then
        COMPREPLY=($(compgen -W "$analytics_sub" -- "$cur"))
      elif [ "$prev" = "--platform" ]; then
        COMPREPLY=($(compgen -W "$platforms" -- "$cur"))
      fi
      ;;
  esac
}

complete -F _posthero_completion posthero
`;

const FISH_COMPLETION = `
# PostHero CLI fish completion
# Add to ~/.config/fish/completions/posthero.fish
# Or run: posthero completion fish > ~/.config/fish/completions/posthero.fish

set -l commands login logout whoami accounts posts media analytics status completion

complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a login       -d 'Save your API key locally'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a logout      -d 'Remove stored API key'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a whoami      -d 'Show current API key info'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a accounts    -d 'Manage connected accounts'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a posts       -d 'Create and manage posts'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a media       -d 'Upload media files'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a analytics   -d 'View analytics'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a status      -d 'Show account overview'
complete -c posthero -f -n "not __fish_seen_subcommand_from $commands" -a completion  -d 'Output shell completion script'

# accounts subcommands
complete -c posthero -f -n "__fish_seen_subcommand_from accounts" -a list -d 'List connected accounts'

# posts subcommands
complete -c posthero -f -n "__fish_seen_subcommand_from posts" -a list    -d 'List posts'
complete -c posthero -f -n "__fish_seen_subcommand_from posts" -a get     -d 'Get a post by ID'
complete -c posthero -f -n "__fish_seen_subcommand_from posts" -a create  -d 'Create a post'
complete -c posthero -f -n "__fish_seen_subcommand_from posts" -a update  -d 'Update a post'
complete -c posthero -f -n "__fish_seen_subcommand_from posts" -a delete  -d 'Delete a post'
complete -c posthero -f -n "__fish_seen_subcommand_from posts" -a publish -d 'Publish a draft immediately'

# analytics subcommands
complete -c posthero -f -n "__fish_seen_subcommand_from analytics" -a summary         -d 'Aggregated KPIs'
complete -c posthero -f -n "__fish_seen_subcommand_from analytics" -a posts           -d 'Paginated post analytics'
complete -c posthero -f -n "__fish_seen_subcommand_from analytics" -a top             -d 'Top performers'
complete -c posthero -f -n "__fish_seen_subcommand_from analytics" -a follower-growth -d 'Follower growth'

# --platform completions
set -l platforms twitter threads instagram tiktok youtube
complete -c posthero -l platform -f -a "$platforms" -d 'Platform'
`;

function completion(shell) {
  const supported = ['zsh', 'bash', 'fish'];

  if (!shell) {
    console.error(chalk.red('Error: shell is required. Supported: ' + supported.join(', ')));
    console.error(chalk.grey('\nUsage:'));
    console.error(chalk.grey('  source <(posthero completion zsh)'));
    console.error(chalk.grey('  source <(posthero completion bash)'));
    console.error(chalk.grey('  posthero completion fish > ~/.config/fish/completions/posthero.fish'));
    process.exit(1);
  }

  if (!supported.includes(shell)) {
    console.error(chalk.red(`Unsupported shell "${shell}". Supported: ${supported.join(', ')}`));
    process.exit(1);
  }

  const scripts = { zsh: ZSH_COMPLETION, bash: BASH_COMPLETION, fish: FISH_COMPLETION };
  process.stdout.on('error', err => { if (err.code === 'EPIPE') process.exit(0); });
  process.stdout.write(scripts[shell]);
}

module.exports = { completion };
