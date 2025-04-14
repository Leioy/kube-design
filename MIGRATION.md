# 从 Jest+Enzyme 迁移到 Vitest+React Testing Library

本文档介绍了如何将测试框架从 Jest+Enzyme 迁移到 Vitest+React Testing Library，以支持 React 18 的新特性。

## 迁移步骤

### 1. 安装新的依赖

```bash
# 安装到workspace根目录
yarn add -D -W vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react jest-axe @types/jest-axe
```

### 2. 创建 Vitest 配置文件

创建文件 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./configs/vitest/setup.ts'],
    include: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
    alias: {
      '@kubed/icons': resolve(__dirname, 'packages/icons/dist'),
      '@kubed/tests': resolve(__dirname, 'packages/tests/src'),
      '@kubed/components': resolve(__dirname, 'packages/components/src'),
      '@kubed/hooks': resolve(__dirname, 'packages/hooks/src'),
    },
  },
});
```

### 3. 创建 Vitest 设置文件

创建文件 `configs/vitest/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展Vitest的expect
expect.extend(matchers as any);

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// 修复React 18中的布局效果
import React from 'react';
React.useLayoutEffect = React.useEffect;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 4. 创建 React Testing Library 辅助函数

创建文件 `packages/tests/src/renderWithTheme.tsx`:

```typescript
import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { themeUtils } from '@kubed/components';

export function renderWithTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(<ThemeProvider theme={themeUtils.getPresets()[0]}>{ui}</ThemeProvider>, options);
}
```

### 5. 更新可访问性测试函数

修改 `packages/tests/src/checkAccessibility.tsx`:

```typescript
import { RenderResult } from '@testing-library/react';
import { axe } from 'jest-axe';

const config = {
  rules: {
    region: {
      enabled: false,
    },
  },
};

// 新版React Testing Library版本
// 使用标准断言
export async function checkRTLAccessibility(rendered: RenderResult) {
  const result = await axe(rendered.container, config);

  // 使用标准断言检查无障碍违规
  expect(result.violations.length).toBe(0);

  // 如果有违规，打印详细信息以便调试
  if (result.violations && result.violations.length > 0) {
    console.error('Accessibility violations found:');
    result.violations.forEach((violation) => {
      console.error(`\nRule violated: ${violation.id}`);
      console.error(`Impact: ${violation.impact}`);
      console.error(`Description: ${violation.description}`);
      console.error(`Help: ${violation.help}`);
      console.error(
        `Affected nodes:`,
        violation.nodes.map((node) => node.html)
      );
    });
  }
}
```

### 6. 更新导出

修改 `packages/tests/src/index.ts`:

```typescript
export { checkRTLAccessibility } from './checkAccessibility';
export { itRendersChildren } from './itRendersChildren';
export { itSupportsClassName } from './itSupportsClassName';
export { itSupportsOthers } from './itSupportsOthers';
export { itSupportsRef } from './itSupportsRef';
export { itSupportsStyle } from './itSupportsStyle';
export { mockResizeObserver } from './mock-resize-observer';
// 保留原始Enzyme辅助函数，用于向后兼容
// @ts-ignore
export { shallowWithTheme, mountWithTheme } from './itSupportsTheme';
// 新的React Testing Library辅助函数
export { renderWithTheme } from './renderWithTheme';
```

### 7. 更新 package.json 中的测试命令

```json
"scripts": {
  "test": "npm run syncpack && vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:jest": "npm run syncpack && npm run jest"
}
```

### 8. 创建新的测试文件

创建使用 React Testing Library 的新测试文件，例如 `Component.rtl.test.tsx`:

```typescript
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithTheme } from '@kubed/tests';
import { Component } from './Component';

describe('@kubed/components/Component with RTL', () => {
  it('renders correctly', () => {
    renderWithTheme(<Component>Test</Component>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    renderWithTheme(<Component onClick={handleClick}>Click me</Component>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const rendered = renderWithTheme(<Component>Accessible component</Component>);
    await checkRTLAccessibility(rendered);
  });
});
```

## 渐进式迁移策略

1. **保留现有测试**：不要立即删除所有 Enzyme 测试，而是采用渐进式迁移
2. **新组件使用 RTL**：所有新组件使用 React Testing Library 进行测试
3. **修改现有组件时迁移**：在修改现有组件时，同时将其测试从 Enzyme 迁移到 RTL
4. **并行运行**：保留 Jest 命令，同时提供 Vitest 命令，确保测试覆盖率不下降

## Enzyme 与 React Testing Library 的区别

| Enzyme                            | React Testing Library                               |
| --------------------------------- | --------------------------------------------------- |
| `shallow(<Component />)`          | `render(<Component />)`                             |
| `wrapper.find('.class')`          | `screen.getByTestId('test-id')`                     |
| `wrapper.find('button').text()`   | `screen.getByRole('button').textContent`            |
| `wrapper.props().disabled`        | `expect(screen.getByRole('button')).toBeDisabled()` |
| `wrapper.simulate('click')`       | `fireEvent.click(screen.getByText('Click me'))`     |
| `mount(<Component {...props} />)` | `render(<Component {...props} />)`                  |
| `wrapper.update()`                | 自动更新，不需要显式调用                            |

## 注意事项

1. React Testing Library 更关注用户交互而非组件实现细节
2. 尽量使用 role、text、label 等进行元素查询，而不是 CSS 选择器或测试 ID
3. Vitest 和 React Testing Library 原生支持异步测试，使用更加直观
4. 使用`vi.fn()`替代`jest.fn()`作为模拟函数
5. 确保在所有测试中使用`renderWithTheme`包装组件，以提供样式主题
