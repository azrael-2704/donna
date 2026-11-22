import {
  SquareAxisHorizontal,
  NigerianNaira,
  StrokeWidth,
} from 'lucide-react';

describe('lucide-react icon API', () => {
  it('exposes the axis icon and the resources added in 1.74.0', () => {
    // `square-centerline-*` was renamed to `square-axis-*` in lucide-react 1.74.0.
    expect(SquareAxisHorizontal).toBeDefined();

    // These resources were introduced in the same release.
    expect(NigerianNaira).toBeDefined();
    expect(StrokeWidth).toBeDefined();
  });
});
