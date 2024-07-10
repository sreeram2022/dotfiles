-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here
--
--
--
-- Lua: keymaps.lua

-- Map jk to Esc in insert mode
vim.api.nvim_set_keymap("i", "jk", "<Esc>", { noremap = true, silent = true })

-- Optional: Map jk to Esc in normal mode (if desired)
vim.api.nvim_set_keymap("n", "jk", "<Esc>", { noremap = true, silent = true })

-- Map F2 to run the current file with python3
vim.api.nvim_set_keymap("n", "<F2>", ":!python3 %", { noremap = true, silent = true })
-- Map space-v to create vertical splits
vim.api.nvim_set_keymap("n", "<Space>v", ":vsplit<CR>", { noremap = true, silent = true })

-- Map space-h to create horizontal splits
vim.api.nvim_set_keymap("n", "<Space>h", ":split<CR>", { noremap = true, silent = true })
