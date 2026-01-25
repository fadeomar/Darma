import {
  Layout,
  Type,
  Gamepad,
  PenTool,
  Hexagon,
  Image as ImgIcon,
  Loader,
  AppWindow,
  GitBranch,
  MousePointerClick,
  CreditCard,
  Database,
  Code,
  Music,
  Film,
  Globe,
  ShieldCheck,
  Compass,
  Edit3,
  MessageSquare,
  Info,
  ToggleLeft,
  List,
  Sliders,
  Keyboard,
  MousePointer,
  Terminal,
  Zap,
  Club,
  Atom,
  Monitor,
  Puzzle,
  Users,
  Star,
  BarChart,
  PieChart,
  Brush,
  Scissors,
  RotateCcw,
  Hand,
  PlayCircle,
  Layers,
  Video,
  Square,
  Activity,
  Smile,
  TrendingUp,
  Circle,
  BarChart2,
  Calculator,
  CloudSun,
  Grid,
  ChevronDown,
} from "lucide-react";
import { JSX } from "react";
type IconMapKey = string;

export const iconMap: Record<IconMapKey, { icon: JSX.Element; label: string }> =
  {
    // Categories for "ui-elements"
    "ui-elements": {
      icon: (
        <div className="flex items-center gap-1">
          <Layout />
          <span className="text-xs opacity-80">UI</span>
          <span>🖼️</span>
        </div>
      ),
      label: "UI Elements",
    },
    buttons: {
      icon: (
        <div className="flex items-center gap-1">
          <MousePointerClick />
          <span className="text-xs opacity-80">Btn</span>
          <span>🔘</span>
        </div>
      ),
      label: "Buttons",
    },
    cards: {
      icon: (
        <div className="flex items-center gap-1">
          <CreditCard />
          <span className="text-xs opacity-80">Card</span>
          <span>💳</span>
        </div>
      ),
      label: "Cards",
    },
    navigation: {
      icon: (
        <div className="flex items-center gap-1">
          <Compass />
          <span className="text-xs opacity-80">Nav</span>
          <span>🧭</span>
        </div>
      ),
      label: "Navigation",
    },
    "forms-inputs": {
      icon: (
        <div className="flex items-center gap-1">
          <Edit3 />
          <span className="text-xs opacity-80">Form</span>
          <span>📝</span>
        </div>
      ),
      label: "Forms & Inputs",
    },
    "modals-popups": {
      icon: (
        <div className="flex items-center gap-1">
          <MessageSquare />
          <span className="text-xs opacity-80">Modal</span>
          <span>💬</span>
        </div>
      ),
      label: "Modals & Popups",
    },
    "loaders-spinners": {
      icon: (
        <div className="flex items-center gap-1">
          <Loader />
          <span className="text-xs opacity-80">Load</span>
          <span>⏳</span>
        </div>
      ),
      label: "Loaders & Spinners",
    },
    tooltips: {
      icon: (
        <div className="flex items-center gap-1">
          <Info />
          <span className="text-xs opacity-80">Tip</span>
          <span>💡</span>
        </div>
      ),
      label: "Tooltips",
    },
    "toggles-switches": {
      icon: (
        <div className="flex items-center gap-1">
          <ToggleLeft />
          <span className="text-xs opacity-80">Toggle</span>
          <span>🔀</span>
        </div>
      ),
      label: "Toggles & Switches",
    },
    accordions: {
      icon: (
        <div className="flex items-center gap-1">
          <List />
          <span className="text-xs opacity-80">Accord</span>
          <span>📋</span>
        </div>
      ),
      label: "Accordions",
    },
    sliders: {
      icon: (
        <div className="flex items-center gap-1">
          <Sliders />
          <span className="text-xs opacity-80">Slide</span>
          <span>🎚️</span>
        </div>
      ),
      label: "Sliders",
    },

    // Categories for "text-effects"
    "text-effects": {
      icon: (
        <div className="flex items-center gap-1">
          <Type />
          <span className="text-xs opacity-80">Text</span>
          <span>🔤</span>
        </div>
      ),
      label: "Text Effects",
    },
    typing: {
      icon: (
        <div className="flex items-center gap-1">
          <Keyboard />
          <span className="text-xs opacity-80">Type</span>
          <span>⌨️</span>
        </div>
      ),
      label: "Typing",
    },
    hover: {
      icon: (
        <div className="flex items-center gap-1">
          <MousePointer />
          <span className="text-xs opacity-80">Hover</span>
          <span>👆</span>
        </div>
      ),
      label: "Hover",
    },
    "animated-text": {
      icon: (
        <div className="flex items-center gap-1">
          <Terminal />
          <span className="text-xs opacity-80">Anim</span>
          <span>💻</span>
        </div>
      ),
      label: "Animated Text",
    },
    "loading-text": {
      icon: (
        <div className="flex items-center gap-1">
          <Loader />
          <span className="text-xs opacity-80">Load</span>
          <span>⌛</span>
        </div>
      ),
      label: "Loading Text",
    },
    distortions: {
      icon: (
        <div className="flex items-center gap-1">
          <Zap />
          <span className="text-xs opacity-80">Distort</span>
          <span>⚡</span>
        </div>
      ),
      label: "Distortions",
    },
    "scroll-triggered": {
      icon: (
        <div className="flex items-center gap-1">
          <ChevronDown />
          <span className="text-xs opacity-80">Scroll</span>
          <span>🔽</span>
        </div>
      ),
      label: "Scroll Triggered",
    },
    "gradient-text": {
      icon: (
        <div className="flex items-center gap-1">
          <span>🌈</span>
          <span className="text-xs opacity-80">Grad</span>
          <span>🌈</span>
        </div>
      ),
      label: "Gradient Text",
    },
    "3d-text": {
      icon: (
        <div className="flex items-center gap-1">
          <Club />
          <span className="text-xs opacity-80">3D</span>
          <span>🔲</span>
        </div>
      ),
      label: "3D Text",
    },

    // Categories for "games"
    games: {
      icon: (
        <div className="flex items-center gap-1">
          <Gamepad />
          <span className="text-xs opacity-80">Game</span>
          <span>🎮</span>
        </div>
      ),
      label: "Games",
    },
    "mini-games": {
      icon: (
        <div className="flex items-center gap-1">
          <Activity />
          <span className="text-xs opacity-80">Mini</span>
          <span>🕹️</span>
        </div>
      ),
      label: "Mini Games",
    },
    "physics-games": {
      icon: (
        <div className="flex items-center gap-1">
          <Atom />
          <Monitor />
          <span className="text-xs opacity-80">Phys</span>
          <span>⚛️</span>
        </div>
      ),
      label: "Physics Games",
    },
    "puzzle-games": {
      icon: (
        <div className="flex items-center gap-1">
          <Puzzle />
          <span className="text-xs opacity-80">Puzzle</span>
          <span>🧩</span>
        </div>
      ),
      label: "Puzzle Games",
    },
    "multiplayer-demos": {
      icon: (
        <div className="flex items-center gap-1">
          <Users />
          <span className="text-xs opacity-80">Multi</span>
          <span>👥</span>
        </div>
      ),
      label: "Multiplayer Demos",
    },

    // Categories for "canvas-projects"
    "canvas-projects": {
      icon: (
        <div className="flex items-center gap-1">
          <PenTool />
          <span className="text-xs opacity-80">Canvas</span>
          <span>🎨</span>
        </div>
      ),
      label: "Canvas Projects",
    },
    particles: {
      icon: (
        <div className="flex items-center gap-1">
          <Star />
          <span className="text-xs opacity-80">Part</span>
          <span>✨</span>
        </div>
      ),
      label: "Particles",
    },
    drawing: {
      icon: (
        <div className="flex items-center gap-1">
          <PenTool />
          <span className="text-xs opacity-80">Draw</span>
          <span>✏️</span>
        </div>
      ),
      label: "Drawing",
    },
    visualizers: {
      icon: (
        <div className="flex items-center gap-1">
          <BarChart />
          <span className="text-xs opacity-80">Viz</span>
          <span>📊</span>
        </div>
      ),
      label: "Visualizers",
    },
    "canvas-games": {
      icon: (
        <div className="flex items-center gap-1">
          <Gamepad />
          <span className="text-xs opacity-80">CGame</span>
          <span>🎮</span>
        </div>
      ),
      label: "Canvas Games",
    },
    charts: {
      icon: (
        <div className="flex items-center gap-1">
          <PieChart />
          <span className="text-xs opacity-80">Chart</span>
          <span>🥧</span>
        </div>
      ),
      label: "Charts",
    },

    // Categories for "shapes"
    shapes: {
      icon: (
        <div className="flex items-center gap-1">
          <Hexagon />
          <Database />
          <span className="text-xs opacity-80">Shape</span>
          <span>🔷</span>
        </div>
      ),
      label: "Shapes",
    },
    "css-art": {
      icon: (
        <div className="flex items-center gap-1">
          <Brush />
          <span className="text-xs opacity-80">CSS</span>
          <span>🖌️</span>
        </div>
      ),
      label: "CSS Art",
    },
    "3d-shapes": {
      icon: (
        <div className="flex items-center gap-1">
          <Club />
          <Globe />
          <span className="text-xs opacity-80">3D</span>
          <span>🧊</span>
        </div>
      ),
      label: "3D Shapes",
    },
    "clip-path-svg": {
      icon: (
        <div className="flex items-center gap-1">
          <Scissors />
          <span className="text-xs opacity-80">Clip</span>
          <span>✂️</span>
        </div>
      ),
      label: "Clip Path SVG",
    },
    "animated-shapes": {
      icon: (
        <div className="flex items-center gap-1">
          <ShieldCheck />
          <RotateCcw />
          <span className="text-xs opacity-80">Anim</span>
          <span>🔄</span>
        </div>
      ),
      label: "Animated Shapes",
    },
    "morphing-shapes": {
      icon: (
        <div className="flex items-center gap-1">
          <RotateCcw />
          <span className="text-xs opacity-80">Morph</span>
          <span>🔄</span>
        </div>
      ),
      label: "Morphing Shapes",
    },
    "shadow-effects": {
      icon: (
        <div className="flex items-center gap-1">
          <span>🌑</span>
          <span className="text-xs opacity-80">Shadow</span>
          <span>🌑</span>
        </div>
      ),
      label: "Shadow Effects",
    },

    // Categories for "backgrounds"
    backgrounds: {
      icon: (
        <div className="flex items-center gap-1">
          <ImgIcon />
          <span className="text-xs opacity-80">BG</span>
          <span>🖼️</span>
        </div>
      ),
      label: "Backgrounds",
    },
    "animated-bg": {
      icon: (
        <div className="flex items-center gap-1">
          <PlayCircle />
          <span className="text-xs opacity-80">AnimBG</span>
          <span>▶️</span>
        </div>
      ),
      label: "Animated BG",
    },
    "glitch-distortion": {
      icon: (
        <div className="flex items-center gap-1">
          <Zap />
          <span className="text-xs opacity-80">Glitch</span>
          <span>⚡</span>
        </div>
      ),
      label: "Glitch Distortion",
    },
    interactive: {
      icon: (
        <div className="flex items-center gap-1">
          <Hand />
          <span className="text-xs opacity-80">Interact</span>
          <span>🤚</span>
        </div>
      ),
      label: "Interactive",
    },
    "gradient-blurred": {
      icon: (
        <div className="flex items-center gap-1">
          <span>🌈</span>
          <span className="text-xs opacity-80">Grad</span>
          <span>🌈</span>
        </div>
      ),
      label: "Gradient Blurred",
    },
    parallax: {
      icon: (
        <div className="flex items-center gap-1">
          <Layers />
          <span className="text-xs opacity-80">Parallax</span>
          <span>🗂️</span>
        </div>
      ),
      label: "Parallax",
    },
    "video-bg": {
      icon: (
        <div className="flex items-center gap-1">
          <Video />
          <span className="text-xs opacity-80">Video</span>
          <span>📹</span>
        </div>
      ),
      label: "Video BG",
    },

    // Categories for "loaders"
    loaders: {
      icon: (
        <div className="flex items-center gap-1">
          <Loader />
          <span className="text-xs opacity-80">Load</span>
          <span>⏳</span>
        </div>
      ),
      label: "Loaders",
    },
    "Basic Shapes & Styles": {
      icon: (
        <div className="flex items-center gap-1">
          <Square />
          <span className="text-xs opacity-80">Basic</span>
          <span>⬜</span>
        </div>
      ),
      label: "Basic Shapes & Styles",
    },
    "Motion & Animation Types": {
      icon: (
        <div className="flex items-center gap-1">
          <Activity />
          <span className="text-xs opacity-80">Motion</span>
          <span>🏃</span>
        </div>
      ),
      label: "Motion & Animation Types",
    },
    "Thematic & Fun Loaders": {
      icon: (
        <div className="flex items-center gap-1">
          <Smile />
          <span className="text-xs opacity-80">Fun</span>
          <span>😊</span>
        </div>
      ),
      label: "Thematic & Fun Loaders",
    },
    "Progress & Status Indicators": {
      icon: (
        <div className="flex items-center gap-1">
          <TrendingUp />
          <span className="text-xs opacity-80">Progress</span>
          <span>📈</span>
        </div>
      ),
      label: "Progress & Status Indicators",
    },
    "Shape-Specific Loaders": {
      icon: (
        <div className="flex items-center gap-1">
          <Circle />
          <span className="text-xs opacity-80">Shape</span>
          <span>⭕</span>
        </div>
      ),
      label: "Shape-Specific Loaders",
    },
    "Unique Mechanics": {
      icon: (
        <div className="flex items-center gap-1">
          <Star />
          <span className="text-xs opacity-80">Unique</span>
          <span>🌟</span>
        </div>
      ),
      label: "Unique Mechanics",
    },
    "skeleton-loaders": {
      icon: (
        <div className="flex items-center gap-1">
          <BarChart2 />
          <span className="text-xs opacity-80">Skel</span>
          <span>📊</span>
        </div>
      ),
      label: "Skeleton Loaders",
    },
    "micro-animations": {
      icon: (
        <div className="flex items-center gap-1">
          <Zap />
          <span className="text-xs opacity-80">Micro</span>
          <span>⚡</span>
        </div>
      ),
      label: "Micro-animations",
    },

    // Categories for "Apps"
    Apps: {
      icon: (
        <div className="flex items-center gap-1">
          <AppWindow />
          <Music />
          <span className="text-xs opacity-80">App</span>
          <span>🏛️</span>
        </div>
      ),
      label: "Apps",
    },
    basic: {
      icon: (
        <div className="flex items-center gap-1">
          <Square />
          <span className="text-xs opacity-80">Basic</span>
          <span>⬜</span>
        </div>
      ),
      label: "Basic",
    },
    "click-based": {
      icon: (
        <div className="flex items-center gap-1">
          <MousePointerClick />
          <span className="text-xs opacity-80">Click</span>
          <span>🖱️</span>
        </div>
      ),
      label: "Click Based",
    },
    generators: {
      icon: (
        <div className="flex items-center gap-1">
          <Code />
          <span className="text-xs opacity-80">Gen</span>
          <span>💻</span>
        </div>
      ),
      label: "Generators",
    },
    calculators: {
      icon: (
        <div className="flex items-center gap-1">
          <Calculator />
          <span className="text-xs opacity-80">Calc</span>
          <span>🧮</span>
        </div>
      ),
      label: "Calculators",
    },
    "todo-lists": {
      icon: (
        <div className="flex items-center gap-1">
          <List />
          <span className="text-xs opacity-80">Todo</span>
          <span>📝</span>
        </div>
      ),
      label: "Todo Lists",
    },
    "weather-widgets": {
      icon: (
        <div className="flex items-center gap-1">
          <CloudSun />
          <span className="text-xs opacity-80">Weather</span>
          <span>☀️</span>
        </div>
      ),
      label: "Weather Widgets",
    },

    // Categories for "svg"
    svg: {
      icon: (
        <div className="flex items-center gap-1">
          <GitBranch />
          <span className="text-xs opacity-80">SVG</span>
          <span>🌿</span>
        </div>
      ),
      label: "SVG",
    },
    icons: {
      icon: (
        <div className="flex items-center gap-1">
          <Star />
          <span className="text-xs opacity-80">Icon</span>
          <span>⭐</span>
        </div>
      ),
      label: "Icons",
    },
    illustrations: {
      icon: (
        <div className="flex items-center gap-1">
          <ImgIcon />
          <span className="text-xs opacity-80">Illus</span>
          <span>🖼️</span>
        </div>
      ),
      label: "Illustrations",
    },
    animations: {
      icon: (
        <div className="flex items-center gap-1">
          <Film />
          <span className="text-xs opacity-80">Anim</span>
          <span>🎞️</span>
        </div>
      ),
      label: "Animations",
    },
    "interactive-svg": {
      icon: (
        <div className="flex items-center gap-1">
          <MousePointerClick />
          <span className="text-xs opacity-80">Interact</span>
          <span>👆</span>
        </div>
      ),
      label: "Interactive SVG",
    },
    "data-visualization": {
      icon: (
        <div className="flex items-center gap-1">
          <BarChart />
          <span className="text-xs opacity-80">Data</span>
          <span>📊</span>
        </div>
      ),
      label: "Data Visualization",
    },
    patterns: {
      icon: (
        <div className="flex items-center gap-1">
          <Grid />
          <span className="text-xs opacity-80">Pattern</span>
          <span>🔲</span>
        </div>
      ),
      label: "Patterns",
    },
  };
