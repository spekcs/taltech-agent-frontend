<template>
  <svg id="" width="100%" height="100%" class="page_pattern_svg">
    <defs id="">
      <pattern
        id="pattern_fill_grid"
        x="0"
        y="-3"
        width="1020"
        height="24"
        patternUnits="userSpaceOnUse"
      >
        <image
          id="pattern_grid_image"
          href="/grid-line-v2-24px.png"
          width="1020"
          height="24"
        ></image>
      </pattern>
      <pattern
        id="pattern_fill_lines"
        x="0"
        y="-3"
        width="1020"
        height="24"
        patternUnits="userSpaceOnUse"
      >
        <image
          id="pattern_lines_image"
          href="/line-line-v2-24px.png"
          width="1020"
          height="24"
        ></image>
      </pattern>
      <clipPath id="pattern-path">
        <circle
          id="pattern-path-circle"
          cx="1063.272705078125"
          cy="649.089111328125"
          r="0"
        ></circle>
      </clipPath>
    </defs>
    <rect
      id="pattern-background"
      fill="url(#pattern_fill_lines)"
      width="100%"
      height="100%"
      opacity="1"
    ></rect>
    <circle
      id="circle-cover"
      cx="1063.272705078125"
      cy="649.089111328125"
      r="0"
      fill="#ffffff"
    ></circle>
    <rect
      id="pattern-foreground"
      fill="url(#pattern_fill_grid)"
      width="100%"
      height="100%"
      opacity="0"
      clip-path="url(#pattern-path)"
    ></rect>
  </svg>
</template>

<style scoped>

.page_pattern_svg {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}
</style>
