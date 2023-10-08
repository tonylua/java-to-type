public class MyEnum2 {
  /**
   * 常量1
   */
  public static final Integer NUM_1 = 0;
  /**
   * 常量2
   * @see xxx
   */
  public static final Integer NUM_TWO = 1;
  public static final Integer NUM_san = 3;
}



// (?:\s*\/\*{2}\n\s*\*\s+((?:[^@].)+?)[\s\S]*\*\/\n\s+?)?public\s+static\s+final\s+(\w+)\s+([\w_]+)\s*=\s*(\w+)
