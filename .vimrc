set mouse=a
set encoding=utf-8
set tabstop=2
set shiftwidth=2
set expandtab
set smarttab
set autoindent
set wrap
set smartcase
set showmatch
set title
set ruler
set et
set number relativenumber
set incsearch
set hlsearch
set autoread
set autowrite
set nobackup
set nowritebackup
set noswapfile
set nocompatible
set hidden
filetype plugin indent on
syntax on

" Title string
set titlestring=%(%F%)%a\ -\ VIM%(\ %M%)

" Highlight cursor line number
hi CursorLineNr cterm=bold
inoremap jk <Esc>
" Vundle settings
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'VundleVim/Vundle.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'jistr/vim-nerdtree-tabs'
call vundle#end()

" Plugin-specific settings
nmap <F1> :NERDTreeToggle<CR>

" Key mappings
let mapleader = "\<Space>"
nmap <leader>l :bnext<CR>
nmap <leader>h :bprevious<CR>
cnoremap w!! execute 'silent! write !sudo tee % >/dev/null' <bar> edit!

" Cursor shape settings
let &t_ti.="\e[1 q"
let &t_SI.="\e[5 q"
let &t_EI.="\e[1 q"
let &t_te.="\e[0 q"

" Search highlighting color
highlight Search ctermfg=grey ctermbg=red
highlight Macro ctermfg=cyan
highlight Special ctermfg=red
nnoremap <silent> <C-l> :nohl<CR><C-l>

" Run Python file
function! RunPythonFile()
    w
    execute "!python3" shellescape(expand('%'))
endfunction
nnoremap <F2> :call RunPythonFile()<CR>
" Window split
nmap <leader>v :vsp<CR>
