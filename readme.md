# My Dev Environment Files 

I created this repo to backup my config files and to easily replicate my workflow on a new desktop.

## Terminal Setup

I've used the default macOS Terminal for a year. Later, I switched to iTerm2, installed Oh My Zsh, and set up a Nerd Font. However, when I installed Neovim themes on iTerm2, they looked very weird. So, I shifted to Kitty, a highly customizable terminal emulator.

### Relevant Files

- [.zshrc](.zshrc) - Zsh Shell Configuration
- [.tmux.conf](.tmux.conf) - Tmux Configuration File
- [.config/yabai/yabairc](.config/yabai/yabairc) - Yabai Window Manager Configuration
- [.config/skhd/skhdrc](.config/skhd/skhdrc) - Skhd Hotkey Daemon Configuration
- [.config/sketchybar](.config/sketchybar/) - SketchyBar Configuration
- [.vimrc](.vimrc) - Vim Editor Configuration

## Neovim Setup

I've tried different Neovim distributions and finally settled on LazyVim. I still use Vim for basic text and code editing. When working on a project with multiple files, I use LazyVim.

- [.config/nvim](.config/nvim) - Neovim Configuration

## Installation

To set up your environment using these configuration files, follow the steps below:

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/sreeram2022/dotfiles.git
    cd dotfiles
    ```

2. **Install Dependencies:**

    Ensure you have Homebrew installed. Then, use the provided Brewfile to install dependencies:

    ```bash
    brew bundle install
    ```

3. **Link Configuration Files:**

    Link the configuration files to their respective locations. For example:

    ```bash
    ln -s $(pwd)/.zshrc ~/.zshrc
    ln -s $(pwd)/.tmux.conf ~/.tmux.conf
    ln -s $(pwd)/.vimrc ~/.vimrc
    ln -s $(pwd)/.config/nvim ~/.config/nvim
    ln -s $(pwd)/.config/yabai ~/.config/yabai
    ln -s $(pwd)/.config/skhd ~/.config/skhd
    ln -s $(pwd)/.config/sketchybar ~/.config/sketchybar
    ```

## Contributing

Feel free to fork this repository and submit pull requests if you have improvements or new configurations to share. Please follow the standard Git workflow:

1. Fork the repository
2. Create a new branch (`git checkout -b feature`)
3. Make your changes and commit them (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature`)
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or suggestions, feel free to open an issue or reach out to me directly.

