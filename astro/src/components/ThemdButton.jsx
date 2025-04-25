import { Button, themeUtils } from '@kubed/components';
import { ThemeProvider } from 'styled-components';

export function ThemedKubedButton(props) {
  // 你可以在这里决定主题来源，或者也通过 props 传入
  const theme = themeUtils.getPresets()[0];

  // 将外部传入的 props 解构出来，或者直接使用 props
  const { children = '按钮', ...buttonProps } = props;

  // 在这个 React 组件内部，KubedButton 不需要 client:* 指令
  return (
    <ThemeProvider theme={theme}>
      <Button {...buttonProps}>{children}</Button>
    </ThemeProvider>
  );
}
