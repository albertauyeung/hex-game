# HEX Game

A web-based implementation of the classic two-player connection board game HEX.

**[Play the game](https://ayeung.dev/hex-game)**

## About HEX

HEX is an abstract strategy board game invented independently by mathematicians Piet Hein (1942) and John Nash (1948). It's played on a rhombus-shaped board made of hexagonal cells, where two players compete to connect their opposite sides.

### Game Rules

- **Players**: Two players take turns - Red (Player 1) and Blue (Player 2)
- **Objective**:
  - Red connects **Top** to **Bottom**
  - Blue connects **Left** to **Right**
- **Gameplay**: Players alternate placing one stone on any empty cell
- **Winning**: First player to create an unbroken chain connecting their sides wins
- **No Draws**: Mathematically proven - someone must always win!

## Features

- Clean, modern UI with sleek hexagonal board visualization
- Dynamic board sizing that adapts to screen size
- Multiple board sizes: 7×7, 9×9, 11×11, 13×13, 14×14, 19×19
- Dark and light theme support with persistent preference
- Winning path highlighting with animation
- In-game instructions and strategy tips
- Responsive landscape-first design optimized for tablets

## Getting Started

Simply open `index.html` in a web browser to play locally, or visit the [live version](https://ayeung.dev/hex-game).

### Controls

- **Click** any empty cell to place your stone
- **New Game** button to restart
- **Board Size** dropdown to change dimensions
- **Theme toggle** (sun/moon icon) to switch between dark and light modes
- **Info button** (i icon) to view game rules and tips

## Technology

Built with vanilla HTML, CSS, and JavaScript:

- SVG-based hexagonal grid rendering
- CSS Grid layout for responsive design
- CSS custom properties for theming
- BFS algorithm for win detection and path highlighting
- LocalStorage for theme persistence

## License

MIT
