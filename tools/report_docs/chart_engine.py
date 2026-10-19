"""
Modul generator flowchart berbasis Matplotlib.
Menghasilkan diagram alir deterministik kualitas publikasi (300 DPI)
tanpa ketergantungan Node.js/Mermaid CLI.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Literal, Optional, Tuple
import textwrap

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.path import Path as MplPath


@dataclass
class Node:
    id: str
    label: str
    x: float
    y: float
    w: float
    h: float
    shape: Literal["process", "terminator", "decision", "io"] = "process"
    bg_color: str = "#FFFFFF"
    border_color: str = "#28253D"
    border_width: float = 1.5
    text_color: str = "#28253D"
    font_size: float = 8.5
    font_family: str = "DejaVu Sans"

    def get_port(self, port: str) -> Tuple[float, float]:
        cx = self.x + self.w / 2
        cy = self.y + self.h / 2
        if port == "top":
            return (cx, self.y + self.h)
        elif port == "bottom":
            return (cx, self.y)
        elif port == "left":
            return (self.x, cy)
        elif port == "right":
            return (self.x + self.w, cy)
        raise ValueError(f"Port tidak valid: {port}")


@dataclass
class Container:
    id: str
    label: str
    x: float
    y: float
    w: float
    h: float
    bg_color: str = "#F0FDF4"
    border_color: str = "#4ADE80"
    border_style: str = "--"
    border_width: float = 1.2
    title_color: str = "#166534"
    font_size: float = 9.5
    font_family: str = "DejaVu Sans"


@dataclass
class Edge:
    source_id: str
    target_id: str
    source_port: str = "bottom"
    target_port: str = "top"
    label: Optional[str] = None
    label_pos: Optional[Tuple[float, float]] = None
    waypoints: Optional[List[Tuple[float, float]]] = None
    style: str = "solid"
    color: str = "#28253D"
    width: float = 1.5


class Flowchart:
    def __init__(
        self,
        figsize: Tuple[float, float] = (10, 7),
        dpi: int = 300,
        xlim: Tuple[float, float] = (0, 100),
        ylim: Tuple[float, float] = (0, 100),
    ):
        self.figsize = figsize
        self.dpi = dpi
        self.xlim = xlim
        self.ylim = ylim
        self.containers: List[Container] = []
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []

    def add_container(
        self,
        id: str,
        label: str,
        x: float,
        y: float,
        w: float,
        h: float,
        bg_color: str = "#F0FDF4",
        border_color: str = "#4ADE80",
        border_style: str = "--",
        border_width: float = 1.2,
        title_color: str = "#166534",
        font_size: float = 9.5,
    ) -> "Flowchart":
        self.containers.append(
            Container(
                id=id,
                label=label,
                x=x,
                y=y,
                w=w,
                h=h,
                bg_color=bg_color,
                border_color=border_color,
                border_style=border_style,
                border_width=border_width,
                title_color=title_color,
                font_size=font_size,
            )
        )
        return self

    def add_node(
        self,
        id: str,
        label: str,
        x: float,
        y: float,
        w: float,
        h: float,
        shape: Literal["process", "terminator", "decision", "io"] = "process",
        bg_color: str = "#FFFFFF",
        border_color: str = "#28253D",
        border_width: float = 1.5,
        text_color: str = "#28253D",
        font_size: float = 8.5,
    ) -> "Flowchart":
        self.nodes[id] = Node(
            id=id,
            label=label,
            x=x,
            y=y,
            w=w,
            h=h,
            shape=shape,
            bg_color=bg_color,
            border_color=border_color,
            border_width=border_width,
            text_color=text_color,
            font_size=font_size,
        )
        return self

    def add_edge(
        self,
        source_id: str,
        target_id: str,
        source_port: str = "bottom",
        target_port: str = "top",
        label: Optional[str] = None,
        label_pos: Optional[Tuple[float, float]] = None,
        waypoints: Optional[List[Tuple[float, float]]] = None,
        style: str = "solid",
        color: str = "#28253D",
        width: float = 1.5,
    ) -> "Flowchart":
        self.edges.append(
            Edge(
                source_id=source_id,
                target_id=target_id,
                source_port=source_port,
                target_port=target_port,
                label=label,
                label_pos=label_pos,
                waypoints=waypoints,
                style=style,
                color=color,
                width=width,
            )
        )
        return self

    def render(self, output_path: Path):
        fig, ax = plt.subplots(figsize=self.figsize, dpi=self.dpi, facecolor="#FFFFFF")
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")
        ax.set_xlim(self.xlim)
        ax.set_ylim(self.ylim)
        ax.axis("off")

        # 1. Render Containers (Swimlanes)
        for c in self.containers:
            rect = patches.FancyBboxPatch(
                (c.x, c.y),
                c.w,
                c.h,
                boxstyle="square,pad=0",
                facecolor=c.bg_color,
                edgecolor=c.border_color,
                linewidth=c.border_width,
                linestyle=c.border_style,
                zorder=1,
            )
            ax.add_patch(rect)
            # Title header
            ax.text(
                c.x + c.w / 2,
                c.y + c.h - 2.5,
                c.label,
                ha="center",
                va="top",
                fontsize=c.font_size,
                fontweight="bold",
                color=c.title_color,
                family=c.font_family,
                zorder=2,
            )

        # 2. Render Edges (Connectors)
        for e in self.edges:
            src_node = self.nodes[e.source_id]
            tgt_node = self.nodes[e.target_id]
            p_start = src_node.get_port(e.source_port)
            p_end = tgt_node.get_port(e.target_port)

            ls = "--" if e.style == "dashed" else "-"
            points = [p_start]
            if e.waypoints:
                points.extend(e.waypoints)
            points.append(p_end)

            if len(points) == 2:
                arrow = patches.FancyArrowPatch(
                    points[0],
                    points[1],
                    arrowstyle="-|>",
                    mutation_scale=11,
                    color=e.color,
                    linewidth=e.width,
                    linestyle=ls,
                    zorder=3,
                )
                ax.add_patch(arrow)
                mid_x = (points[0][0] + points[1][0]) / 2
                mid_y = (points[0][1] + points[1][1]) / 2
            else:
                codes = [MplPath.MOVETO] + [MplPath.LINETO] * (len(points) - 1)
                path = MplPath(points, codes)
                arrow = patches.FancyArrowPatch(
                    path=path,
                    arrowstyle="-|>",
                    mutation_scale=11,
                    color=e.color,
                    linewidth=e.width,
                    linestyle=ls,
                    zorder=3,
                )
                ax.add_patch(arrow)
                # Middle of waypoints
                mid_idx = len(points) // 2
                mid_x = points[mid_idx][0]
                mid_y = points[mid_idx][1]

            if e.label:
                lx = e.label_pos[0] if e.label_pos else mid_x
                ly = e.label_pos[1] if e.label_pos else mid_y
                ax.text(
                    lx,
                    ly,
                    e.label,
                    ha="center",
                    va="center",
                    fontsize=7.5,
                    fontweight="bold",
                    color=e.color,
                    family="DejaVu Sans",
                    bbox=dict(
                        boxstyle="round,pad=0.25",
                        facecolor="#FFFFFF",
                        edgecolor="#CBD5E1",
                        linewidth=0.8,
                    ),
                    zorder=4,
                )

        # 3. Render Nodes
        for n in self.nodes.values():
            if n.shape == "terminator":
                patch = patches.FancyBboxPatch(
                    (n.x, n.y),
                    n.w,
                    n.h,
                    boxstyle=f"round,pad=0,rounding_size={min(n.w, n.h)*0.45}",
                    facecolor=n.bg_color,
                    edgecolor=n.border_color,
                    linewidth=n.border_width,
                    zorder=5,
                )
            elif n.shape == "process":
                patch = patches.FancyBboxPatch(
                    (n.x, n.y),
                    n.w,
                    n.h,
                    boxstyle="round,pad=0,rounding_size=1.5",
                    facecolor=n.bg_color,
                    edgecolor=n.border_color,
                    linewidth=n.border_width,
                    zorder=5,
                )
            elif n.shape == "decision":
                cx = n.x + n.w / 2
                cy = n.y + n.h / 2
                pts = [[cx, n.y + n.h], [n.x + n.w, cy], [cx, n.y], [n.x, cy]]
                patch = patches.Polygon(
                    pts,
                    closed=True,
                    facecolor=n.bg_color,
                    edgecolor=n.border_color,
                    linewidth=n.border_width,
                    zorder=5,
                )
            elif n.shape == "io":
                slant = n.w * 0.12
                pts = [
                    [n.x + slant, n.y + n.h],
                    [n.x + n.w, n.y + n.h],
                    [n.x + n.w - slant, n.y],
                    [n.x, n.y],
                ]
                patch = patches.Polygon(
                    pts,
                    closed=True,
                    facecolor=n.bg_color,
                    edgecolor=n.border_color,
                    linewidth=n.border_width,
                    zorder=5,
                )
            else:
                patch = patches.Rectangle(
                    (n.x, n.y),
                    n.w,
                    n.h,
                    facecolor=n.bg_color,
                    edgecolor=n.border_color,
                    linewidth=n.border_width,
                    zorder=5,
                )
            ax.add_patch(patch)

            # Node label text
            wrapped = textwrap.fill(n.label, width=22)
            cx = n.x + n.w / 2
            cy = n.y + n.h / 2
            ax.text(
                cx,
                cy,
                wrapped,
                ha="center",
                va="center",
                fontsize=n.font_size,
                color=n.text_color,
                family=n.font_family,
                zorder=6,
            )

        output_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_path, bbox_inches="tight", pad_inches=0.1, facecolor="#FFFFFF")
        plt.close(fig)
