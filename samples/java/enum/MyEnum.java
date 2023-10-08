// /**
//  * @readonly
//  * @enum {String}
//  */
// const MyEnum = {
//   VALUEA: '1'; // 规划中
//   VALUE_B: '2'; // 333
//   VALUEC: '3'; // sss
// }
public enum MyEnum {
  VALUEA("1", "规划中"),
  VALUE_B("2", "333"),
  VALUEC("3", "sss"),
  ;

  private String code;
  private String name;

  MyEnum(String code, String name) {
      this.code = code;
      this.name = name;
  }
  public String getCode() {
    return code;
  }
  public String getName() {
    return name;
  }
}
