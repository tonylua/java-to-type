interface Shape {
    double area();
}

public enum Geometry implements Shape {
    CIRCLE(3.14159265359),
    SQUARE(1.0),
    TRIANGLE(0.5);

    private double area;

    Geometry(double area) {
        this.area = area;
    }

    @Override
    public double area() {
        return area;
    }
}
