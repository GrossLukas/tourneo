import { spacing, fontSize, fontWeight, borderRadius, layout, animation, shadows } from '../theme/spacing';

describe('Spacing System', () => {
  it('spacing values follow 4pt grid', () => {
    expect(spacing.xxs).toBe(2);
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(20);
    expect(spacing.xxl).toBe(24);
  });

  it('all spacing values are numbers', () => {
    for (const value of Object.values(spacing)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe('Typography', () => {
  it('fontSize scale is ascending', () => {
    expect(fontSize.xxs).toBeLessThan(fontSize.xs);
    expect(fontSize.xs).toBeLessThan(fontSize.sm);
    expect(fontSize.sm).toBeLessThan(fontSize.base);
    expect(fontSize.base).toBeLessThan(fontSize.lg);
    expect(fontSize.lg).toBeLessThan(fontSize.xl);
  });

  it('fontWeight has all required weights', () => {
    expect(fontWeight.light).toBe('300');
    expect(fontWeight.regular).toBe('400');
    expect(fontWeight.medium).toBe('500');
    expect(fontWeight.semibold).toBe('600');
    expect(fontWeight.bold).toBe('700');
    expect(fontWeight.extrabold).toBe('800');
  });
});

describe('Border Radius', () => {
  it('borderRadius scale is ascending', () => {
    expect(borderRadius.xs).toBeLessThan(borderRadius.sm);
    expect(borderRadius.sm).toBeLessThan(borderRadius.md);
    expect(borderRadius.md).toBeLessThan(borderRadius.lg);
  });

  it('full borderRadius is very large', () => {
    expect(borderRadius.full).toBe(9999);
  });
});

describe('Layout', () => {
  it('has standard layout values', () => {
    expect(layout.screenPadding).toBe(spacing.lg);
    expect(layout.inputHeight).toBe(52);
    expect(layout.buttonHeight).toBe(52);
    expect(layout.headerHeight).toBe(56);
  });

  it('avatar sizes are ascending', () => {
    expect(layout.avatarSm).toBeLessThan(layout.avatarMd);
    expect(layout.avatarMd).toBeLessThan(layout.avatarLg);
    expect(layout.avatarLg).toBeLessThan(layout.avatarXl);
  });
});

describe('Shadows', () => {
  it('glow shadow uses primary color', () => {
    expect(shadows.glow.shadowColor).toBe('#6366F1');
  });

  it('shadow scale has increasing opacity', () => {
    expect(shadows.none.shadowOpacity).toBe(0);
    expect(shadows.xs.shadowOpacity).toBeLessThan(shadows.sm.shadowOpacity);
    expect(shadows.sm.shadowOpacity).toBeLessThan(shadows.md.shadowOpacity);
    expect(shadows.md.shadowOpacity).toBeLessThan(shadows.lg.shadowOpacity);
  });
});

describe('Animation', () => {
  it('has duration presets', () => {
    expect(animation.fast).toBeLessThan(animation.normal);
    expect(animation.normal).toBeLessThan(animation.slow);
  });

  it('has spring config', () => {
    expect(animation.spring.damping).toBeDefined();
    expect(animation.spring.stiffness).toBeDefined();
  });
});
