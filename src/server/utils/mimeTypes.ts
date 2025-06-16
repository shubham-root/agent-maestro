// MIME type mappings for various file extensions
export const MIME_TYPES: Record<string, string> = {
  // Text files
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".rtf": "text/rtf",

  // Web technologies
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".scss": "text/scss",
  ".sass": "text/sass",
  ".less": "text/less",
  ".xml": "application/xml",
  ".xhtml": "application/xhtml+xml",
  ".svg": "image/svg+xml",

  // JavaScript and TypeScript
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".jsx": "text/jsx",
  ".ts": "application/typescript",
  ".tsx": "text/tsx",
  ".json": "application/json",
  ".json5": "application/json5",
  ".jsonc": "application/jsonc",

  // Python
  ".py": "text/x-python",
  ".pyw": "text/x-python",
  ".pyx": "text/x-python",
  ".pyi": "text/x-python",
  ".ipynb": "application/json",

  // Java and JVM languages
  ".java": "text/x-java-source",
  ".class": "application/java-vm",
  ".jar": "application/java-archive",
  ".kt": "text/x-kotlin",
  ".kts": "text/x-kotlin",
  ".scala": "text/x-scala",
  ".groovy": "text/x-groovy",

  // C/C++
  ".c": "text/x-c",
  ".h": "text/x-c",
  ".cpp": "text/x-c++src",
  ".cc": "text/x-c++src",
  ".cxx": "text/x-c++src",
  ".hpp": "text/x-c++hdr",
  ".hh": "text/x-c++hdr",
  ".hxx": "text/x-c++hdr",

  // C#
  ".cs": "text/x-csharp",
  ".csx": "text/x-csharp",
  ".vb": "text/x-vb",

  // Go
  ".go": "text/x-go",
  ".mod": "text/x-go-mod",
  ".sum": "text/plain",

  // Rust
  ".rs": "text/x-rust",
  ".toml": "application/toml",

  // PHP
  ".php": "text/x-php",
  ".php3": "text/x-php",
  ".php4": "text/x-php",
  ".php5": "text/x-php",
  ".phtml": "text/x-php",

  // Ruby
  ".rb": "text/x-ruby",
  ".rbw": "text/x-ruby",
  ".rake": "text/x-ruby",
  ".gemspec": "text/x-ruby",

  // Swift
  ".swift": "text/x-swift",

  // Objective-C
  ".m": "text/x-objcsrc",
  ".mm": "text/x-objc++src",

  // Shell scripts
  ".sh": "application/x-sh",
  ".bash": "application/x-sh",
  ".zsh": "application/x-sh",
  ".fish": "application/x-sh",
  ".ps1": "application/x-powershell",
  ".bat": "application/x-bat",
  ".cmd": "application/x-bat",

  // Configuration files
  ".yml": "application/yaml",
  ".yaml": "application/yaml",
  ".ini": "text/plain",
  ".cfg": "text/plain",
  ".conf": "text/plain",
  ".properties": "text/plain",
  ".env": "text/plain",

  // Database
  ".sql": "application/sql",
  ".sqlite": "application/x-sqlite3",
  ".db": "application/x-sqlite3",

  // Markup and templating
  ".twig": "text/x-twig",
  ".mustache": "text/x-mustache",
  ".hbs": "text/x-handlebars",
  ".ejs": "text/x-ejs",
  ".pug": "text/x-pug",
  ".jade": "text/x-jade",

  // Documentation
  ".tex": "text/x-tex",
  ".latex": "text/x-tex",
  ".rst": "text/x-rst",
  ".adoc": "text/x-asciidoc",

  // Images
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",

  // Archives
  ".zip": "application/zip",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".bz2": "application/x-bzip2",
  ".7z": "application/x-7z-compressed",
  ".rar": "application/x-rar-compressed",

  // Documents
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Binary executables
  ".exe": "application/x-msdownload",
  ".dll": "application/x-msdownload",
  ".so": "application/x-sharedlib",
  ".dylib": "application/x-sharedlib",

  // Others
  ".lock": "text/plain",
  ".log": "text/plain",
  ".gitignore": "text/plain",
  ".gitattributes": "text/plain",
  ".editorconfig": "text/plain",
  ".dockerignore": "text/plain",
  ".dockerfile": "text/x-dockerfile",
};

export function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase();

  // Handle special cases without extension
  const fileName = filePath.split("/").pop() || "";
  const specialFiles: Record<string, string> = {
    dockerfile: "text/x-dockerfile",
    makefile: "text/x-makefile",
    "cmakelists.txt": "text/x-cmake",
    "package.json": "application/json",
    "tsconfig.json": "application/json",
    "webpack.config.js": "application/javascript",
    "babel.config.js": "application/javascript",
    "eslint.config.js": "application/javascript",
    ".eslintrc": "application/json",
    ".prettierrc": "application/json",
    ".babelrc": "application/json",
  };

  if (specialFiles[fileName.toLowerCase()]) {
    return specialFiles[fileName.toLowerCase()];
  }

  // Extract extension
  const lastDotIndex = filePath.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return "application/octet-stream";
  }

  const extension = filePath.substring(lastDotIndex).toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
}
