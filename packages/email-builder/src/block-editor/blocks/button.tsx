import {
  BUTTON_SHAPES,
  BUTTON_SIZES,
  buttonShapeOf,
  buttonSizeOf,
  DEFAULT_BLOCK_PADDING,
  resolveBrand,
  resolveFont,
  type ButtonBlock,
} from '../../design'
import {
  AlignInput,
  ColorInput,
  NumberInput,
  Section,
  Segmented,
  TextInput,
  Toggle,
} from '../controls'
import { useEditorApi } from '../context'
import {
  StyleSection,
  useBlockEdit,
  type BlockModule,
  type InspectorProps,
  type ViewProps,
} from './shared'

const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

function View({ block }: ViewProps<ButtonBlock>) {
  const api = useEditorApi()
  const { style } = block
  const outer = style.padding ?? DEFAULT_BLOCK_PADDING.button
  const border =
    style.border_width && style.border_color
      ? `${style.border_width}px solid ${resolveBrand(style.border_color, api.brand)}`
      : 'none'
  return (
    <div
      className="seb-b seb-b-button"
      style={{
        padding: outer.map((side) => `${side}px`).join(' '),
        display: 'flex',
        justifyContent: JUSTIFY[block.align],
      }}
    >
      <span
        className="seb-btn"
        title={block.url || 'No link yet'}
        style={{
          display: block.full_width ? 'block' : 'inline-block',
          width: block.full_width ? '100%' : undefined,
          textAlign: 'center',
          background: resolveBrand(style.background ?? 'brand.primary_color', api.brand),
          color: resolveBrand(style.color ?? 'brand.button_text_color', api.brand),
          fontFamily: resolveFont(style.font, api.brand) || undefined,
          borderRadius: style.radius ?? 6,
          padding: `${style.padding_y ?? 12}px ${style.padding_x ?? 24}px`,
          fontSize: style.font_size ?? 16,
          fontWeight: style.font_weight === 'normal' ? 400 : 700,
          border,
        }}
      >
        {block.label || 'Button'}
      </span>
    </div>
  )
}

function Inspector({ block }: InspectorProps<ButtonBlock>) {
  const { api, set } = useBlockEdit(block)
  const style = block.style
  const setStyle = (patch: Partial<ButtonBlock['style']>, key?: string) => {
    const merged: Record<string, unknown> = { ...style, ...patch }
    for (const name of Object.keys(merged)) if (merged[name] == null) delete merged[name]
    return set(
      { style: merged as unknown as ButtonBlock['style'] },
      key ? `style.${key}` : undefined,
    )
  }
  return (
    <>
      <Section title="Button">
        <TextInput
          label="Label"
          value={block.label}
          onChange={(label) => set({ label }, 'label')}
        />
        <TextInput
          label="Link address"
          trim
          value={block.url}
          placeholder="https://"
          hint="https://, mailto:, tel: or a merge field."
          onChange={(url) => set({ url }, 'url')}
        />
        <AlignInput value={block.align} onChange={(align) => set({ align })} />
        <Toggle
          label="Full width"
          checked={block.full_width}
          onChange={(full_width) => set({ full_width })}
        />
      </Section>
      <Section title="Look">
        <Segmented
          label="Size"
          value={buttonSizeOf(style)}
          options={BUTTON_SIZES.map((size) => ({ value: size.id, label: size.label }))}
          onChange={(id) => {
            const size = BUTTON_SIZES.find((s) => s.id === id)!
            setStyle({ padding_y: size.padding_y, padding_x: size.padding_x })
          }}
        />
        <Segmented
          label="Shape"
          value={buttonShapeOf(style)}
          options={BUTTON_SHAPES.map((shape) => ({ value: shape.id, label: shape.label }))}
          onChange={(id) => setStyle({ radius: BUTTON_SHAPES.find((s) => s.id === id)!.radius })}
        />
        <ColorInput
          label="Background"
          value={style.background}
          brand={api.brand}
          clearable
          inheritLabel="Brand button colour"
          onChange={(background) => setStyle({ background })}
        />
        <ColorInput
          label="Text colour"
          value={style.color}
          brand={api.brand}
          clearable
          inheritLabel="Brand button text"
          onChange={(color) => setStyle({ color })}
        />
        <NumberInput
          label="Corner radius"
          value={style.radius ?? 6}
          min={0}
          max={40}
          unit="px"
          onChange={(radius) => setStyle({ radius }, 'radius')}
        />
        <NumberInput
          label="Padding up and down"
          value={style.padding_y ?? 12}
          min={0}
          max={40}
          unit="px"
          onChange={(padding_y) => setStyle({ padding_y }, 'padding_y')}
        />
        <NumberInput
          label="Padding left and right"
          value={style.padding_x ?? 24}
          min={0}
          max={100}
          unit="px"
          onChange={(padding_x) => setStyle({ padding_x }, 'padding_x')}
        />
        <NumberInput
          label="Font size"
          value={style.font_size ?? 16}
          min={12}
          max={32}
          unit="px"
          onChange={(font_size) => setStyle({ font_size }, 'font_size')}
        />
        <Segmented
          label="Weight"
          value={style.font_weight ?? 'bold'}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'bold', label: 'Bold' },
          ]}
          onChange={(font_weight) => setStyle({ font_weight })}
        />
        <ColorInput
          label="Border colour"
          value={style.border_color}
          brand={api.brand}
          clearable
          onChange={(border_color) => setStyle({ border_color })}
        />
        <NumberInput
          label="Border width"
          value={style.border_width ?? 0}
          min={0}
          max={4}
          unit="px"
          onChange={(border_width) => setStyle({ border_width }, 'border_width')}
        />
      </Section>
      <StyleSection block={block} fields={button.style} />
    </>
  )
}

export const button: BlockModule<ButtonBlock> = {
  type: 'button',
  label: 'Button',
  icon: 'button',
  summary: (block) => block.label || 'no label',
  View,
  Inspector,
  style: ['padding', 'font'],
}
